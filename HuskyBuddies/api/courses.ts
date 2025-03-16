import { VercelRequest, VercelResponse } from '@vercel/node';
import { getGlobalCourses } from '../backend/firebase/firestoreService.js'; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // fetch courses from Firestore
    const courses = await getGlobalCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses from Firestore:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}