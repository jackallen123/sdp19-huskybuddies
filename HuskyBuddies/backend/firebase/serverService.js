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
