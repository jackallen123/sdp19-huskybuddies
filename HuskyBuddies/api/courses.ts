import { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeAllCourses } from '../backend/helper';
import { getGlobalCourses, storeGlobalCourses } from '../backend/firebase/firestoreService'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // check if force refresh is requested
    const forceRefresh = req.query.refresh === 'true';

    // check if we have cached data
    let courses;
    if (!forceRefresh) {
      // try to get cached courses
      const cachedCourses = await getGlobalCourses();
      if (cachedCourses) {
        // cache hit - return cached data
        return res.status(200).json({
          source: 'cache',
          data:cachedCourses
        });
      }
    }

    // cache miss or force refresh - call script to update data
    console.log("Cache miss or refresh requested, fetching fresh course data");
    courses = await scrapeAllCourses();

    // store in cache for future requests
    await storeGlobalCourses(courses);

    res.status(200).json({
      source: 'live',
      data: courses
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}