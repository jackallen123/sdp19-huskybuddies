const { db } = require("./serverConfig");
const { doc, setDoc, getDoc, Timestamp } = require("firebase/firestore");

/*
 * GLOBAL CACHE DB INTERACTIONS
 */

/**
 * Stores courses in the global cache
 * @param {Array} courses - Array of courses to cache
 */
export const storeGlobalCourses = async (courses) => {
  try {
    // store courses w/ timestamp
    const globalCacheRef = doc(db, "globalCache", "courses");
    await setDoc(globalCacheRef, {
      data: courses,
      lastUpdated: Timestamp.now(),
    });
    console.log(`Cached ${courses.length} courses in global cache`);
  } catch (error) {
    console.error("Error storing courses in global cache:", error);
    throw error;
  }
};

/**
 * Retrieves courses from global cache only if they exist & are fresh
 * @param {number} maxAgeInHours - max age of cache before considered stale
 * @returns {Promise<Object|null>} - The cached courses or null if not found/stale
 */
export const getGlobalCourses = async (maxAgeInHours = 168) => {
  try {
    const globalCacheRef = doc(db, "globalCache", "courses");
    const cacheDoc = await getDoc(globalCacheRef);

    if (cacheDoc.exists()) {
      // get the data
      const cacheData = cacheDoc.data();

      // get when courses were last updated
      const lastUpdated = cacheData.lastUpdated.toDate();

      // get current time
      const now = new Date();

      // get age of course data
      const ageInHours = (now - lastUpdated) / (1000 * 60 * 60);

      // check if cache is fresh
      if (ageInHours < maxAgeInHours) {
        console.log(
          `Using cached courses (${ageInHours.toFixed(2)} hours old)`
        );
        return cacheData.data;
      } else {
        console.log(`Cache is stale (${ageInHours.toFixed(2)} hours old)`);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting courses from global cache", error);
    return null;
  }
};

/**
 * Stores course sections in the global cache
 * @param {string} courseCode - The course code
 * @param {Array} sections - Array of section objects
 */
export const storeGlobalSections = async (courseCode, sections) => {
  try {
    // store sections w/ timestamp
    const globalSectionRef = doc(
      db,
      "globalCache",
      "sections",
      courseCode,
      "data"
    );
    await setDoc(globalSectionRef, {
      data: sections,
      lastUpdated: Timestamp.now(),
    });
    console.log(`Cached ${sections.length} sections for ${courseCode}`);
  } catch (error) {
    console.error(
      `Error storing sections for ${courseCode} in global cache:`,
      error
    );
    throw error;
  }
};

/**
 * Retrieves course sections from the global cache if they exist and are fresh
 * @param {string} courseCode - The course code to retrieve sections for
 * @param {number} maxAgeInHours - Maximum age of cache in hours before considered stale
 * @returns {Promise<Object|null>} - The cached sections or null if not found/stale
 */
export const getGlobalSections = async (courseCode, maxAgeInHours = 24) => {
  try {
    const globalSectionRef = doc(
      db,
      "globalCache",
      "sections",
      courseCode,
      "data"
    );
    const cacheDoc = await getDoc(globalSectionRef);

    if (cacheDoc.exists()) {
      // get the data
      const cacheData = cacheDoc.data();

      // get when sections were last updated
      const lastUpdated = cacheData.lastUpdated.toDate();

      // get current time
      const now = new Date();

      // get age of section data
      const ageInHours = (now - lastUpdated) / (1000 * 60 * 60);

      // check if cache is fresh
      if (ageInHours < maxAgeInHours) {
        console.log(
          `Using cached sections for ${courseCode} (${ageInHours.toFixed(
            2
          )} hours old)`
        );
        return cacheData.data;
      } else {
        console.log(`Cache is stale (${ageInHours.toFixed(2)} hours old)`);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error(
      `Error getting sections for ${courseCode} from global cache:`,
      error
    );
    return null;
  }
};
