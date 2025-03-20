import { VercelRequest, VercelResponse } from "@vercel/node";
import { scrapeAllCourses } from "../backend/helper";
import {
  getGlobalCourses,
  storeGlobalCourses,
} from "../backend/firebase/serverService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // first try to get cached courses
    const cachedCourses = await getGlobalCourses();

    if (cachedCourses) {
      console.log("Cache hit, fetching course data from database");
      // cache hit - return cached data
      return res.status(200).json({
        source: "cache",
        data: cachedCourses,
      });
    }

    // cache miss - call script to fetch fresh data
    console.log("Cache miss, fetching fresh course data");
    const courses = await scrapeAllCourses();

    // store in cache for future requests
    await storeGlobalCourses(courses);

    res.status(200).json({
      source: "live",
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}
