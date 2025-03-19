import { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeAllCourses } from '../backend/helper';
import { storeGlobalCourses } from '../services/firestoreService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // do the scraping
    const courses = await scrapeAllCourses();
    
    // store the courses in db
    await storeGlobalCourses(courses);

    res.status(200).json({ message: "Courses updated successfully", count: courses.length });
  } catch (error) {
    console.error("Error updating courses via cron:", error);
    res.status(500).json({ error: "Failed to update courses" });
  }
}