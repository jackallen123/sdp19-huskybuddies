import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { setTimeout } from "timers/promises";

const baseUrl = "https://catalog.uconn.edu";

// interfaces for course and section data
interface Section {
  sectionNumber: string;
  meets: string;
  instructor: string;
}

interface Course {
  courseCode: string;
  title: string;
  sections: Section[];
}

// configure axios defaults
const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
});

// configure retries and batch sizes
const MAX_RETRIES = 3; // maximum retry attempts for failed requests
const RETRY_DELAY = 100; // initial delay between retries
const BATCH_SIZE = 62; // # subjects to process concurrently
const BATCH_DELAY = 100; // delay between processing batches

/**
 * retry function that attempts an operation multiple times
 * @param operation - async operation to retry
 * @param retries - number of remaining attempts
 * @param delay - current delay before the next retry
 * @returns promise resolving to the operation's result
 * @throws original error if all retries are exhausted
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      // wait for specified delay before retrying
      await setTimeout(delay);
      // retry with one fewer attempt and longer delay
      return retryOperation(operation, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

/**
 * fetches and extracts subject links from undergraduate course catalog page
 * @returns array of subject URL paths
 */
async function getSubjectLinks(): Promise<string[]> {
  try {
    const { data } = await retryOperation(() =>
      axiosInstance.get(`${baseUrl}/undergraduate/courses/#coursetext`)
    );
    const $ = cheerio.load(data);

    // extract subject links and filter out anchor links
    const subjectLinks = $("div.az_sitemap a")
      .map((_, el) => $(el).attr("href"))
      .get()
      .filter((link) => link && !link.startsWith("#"));

    return subjectLinks;
  } catch (error) {
    console.error("Error fetching subject links:", error);
    return [];
  }
}

/**
 * scrapes course info from a specific subject page
 * @param subjectUrl - url of the subject page to scrape
 * @returns array of course objects containing code (i.e., CSE 2050) and name (i.e., Data Structures and Algorithms)
 */
async function getCoursesFromSubjectPage(subjectUrl: string) {
  try {
    const { data } = await retryOperation(() => axiosInstance.get(subjectUrl));
    const $ = cheerio.load(data);

    // find each course block and extract info
    const courses: { code: string; name: string }[] = [];
    $(".courseblock .cols.noindent").each((_, element) => {
      const courseCode = $(element)
        .find(".text.detail-code strong")
        .text()
        .trim();
      const courseName = $(element)
        .find(".text.detail-title strong")
        .text()
        .trim();
      if (courseCode && courseName) {
        const cleanedCourseCode = courseCode.replace(/\.$/, "");
        courses.push({ code: cleanedCourseCode, name: courseName });
      }
    });

    return courses;
  } catch (error) {
    console.error(`Error fetching courses from ${subjectUrl}:`, error);
    return [];
  }
}

/**
 * processes a batch of subject URLs concurrently
 * @param subjectUrls - array of all subject urls being processed
 * @param startIdx - starting index for current batch
 * @param batchSize - number of subjects to process in each batch
 * @returns array of course objects from entire batch
 */
async function processBatch(
  subjectUrls: string[],
  startIdx: number,
  batchSize: number
): Promise<{ code: string; name: string }[]> {
  // get the subset of URLs for this batch
  const batch = subjectUrls.slice(startIdx, startIdx + batchSize);

  // process all URLs concurrently
  const batchResults = await Promise.all(
    batch.map(async (subjectUrl) => {
      const fullUrl = `${baseUrl}${subjectUrl}`;
      try {
        return await getCoursesFromSubjectPage(fullUrl);
      } catch (error) {
        console.error(`Failed to process ${fullUrl}:`, error);
        return [];
      }
    })
  );

  // combines all results into a single array
  return batchResults.flat();
}

/**
 * main function to scrape all courses from UConn catalog
 * @returns promise resolving to an array of all courses
 */
export async function scrapeAllCourses() {
  try {
    // get all subject links
    const subjectLinks = await getSubjectLinks();
    if (!subjectLinks || subjectLinks.length === 0) {
      throw new Error("No subject links found.");
    }

    const allCourses: { code: string; name: string }[] = [];
    let processedCount = 0;
    const totalSubjects = subjectLinks.length;

    // process subjects in batches
    for (let i = 0; i < subjectLinks.length; i += BATCH_SIZE) {
      // process current batch
      const batchCourses = await processBatch(subjectLinks, i, BATCH_SIZE);
      allCourses.push(...batchCourses);

      // update and log process
      processedCount += Math.min(BATCH_SIZE, subjectLinks.length - i);
      console.log(`Processed ${processedCount}/${totalSubjects} subjects`);

      // add delay between batches to prevent overloading
      if (i + BATCH_SIZE < subjectLinks.length) {
        await setTimeout(BATCH_DELAY);
      }
    }

    return allCourses;
  } catch (error) {
    console.error("Error in scrapeAllCourses:", error);
    throw error;
  }
}

/**
 * fetches course sections for a specific course
 * @param courseCode - the course code to fetch sections for
 * @returns promise resolving to any array of course objects with section information
 */
export async function fetchCourseSections(
  courseCode: string
): Promise<Course[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://catalog.uconn.edu/course-search/");

    // wait for the form to load
    await page.waitForSelector("#search-form");

    // fills out the search form
    await page.select("#crit-srcdb", "1248");
    await page.select("#crit-camp", "STORR@STORRS");
    await page.select("#crit-coursetype", "coursetype_ugrad");
    await page.type("#crit-keyword", courseCode);

    // click the search button and wait for results
    await Promise.all([
      page.click("#search-button"),
      page.waitForSelector(".result"),
    ]);

    // extract section info
    const sections = await page.evaluate((courseCode) => {
      const results = Array.from(document.querySelectorAll(".result"));
      const sections: Course[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const isMainSection = result.classList.contains("result--group-start");

        if (isMainSection) {
          const courseCodeElement = result.querySelector(".result__code");
          const titleElement = result.querySelector(".result__title");

          if (
            courseCodeElement &&
            courseCodeElement.textContent?.trim() === courseCode
          ) {
            const course: Course = {
              courseCode: courseCodeElement.textContent.trim(),
              title: titleElement?.textContent?.trim() || "",
              sections: [],
            };

            // process main section and subsections
            for (let j = i; j < results.length; j++) {
              const sectionResult = results[j];
              const sectionNumber =
                sectionResult
                  .querySelector(".result__flex--3")
                  ?.textContent?.replace("Section Number:", "")
                  .trim() || "";
              const meets =
                sectionResult
                  .querySelector(".flex--grow")
                  ?.textContent?.replace("Meets:", "")
                  .trim() || "";
              const instructor =
                sectionResult
                  .querySelector(".result__flex--9")
                  ?.textContent?.replace("Instructor:", "")
                  .trim() || "";

              course.sections.push({
                sectionNumber,
                meets,
                instructor,
              });

              if (
                j + 1 < results.length &&
                results[j + 1].classList.contains("result--group-start")
              ) {
                break;
              }
            }

            course.sections = course.sections.filter(section => 
              section.sectionNumber !== '' || section.meets !== '' || section.instructor !== ''
            );

            sections.push(course);
          }
        }
      }

      return sections;
    }, courseCode);

    return sections;
  } catch (error) {
    console.error(`Error fetching sections for ${courseCode}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}