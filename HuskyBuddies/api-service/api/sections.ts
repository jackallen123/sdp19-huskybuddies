import { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchCourseSections } from '../backend/helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const { courseCode } = req.query;
  if (!courseCode || typeof courseCode !== 'string') {
    res.status(400).json({ error: 'Missing or invalid courseCode' });
    return;
  }
  
  try {
    const sections = await fetchCourseSections(courseCode);
    res.status(200).json(sections);
  } catch (error) {
    console.error(`Error fetching sections for ${courseCode}:`, error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
}
