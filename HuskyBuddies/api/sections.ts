import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCourseSections } from "../backend/helper";
import {
  getGlobalSections,
  storeGlobalSections,
} from "../backend/firebase/serverService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { courseCode } = req.query;
  if (!courseCode || typeof courseCode !== "string") {
    res.status(400).json({ error: "Missing or invalid courseCode" });
    return;
  }

  try {
    // check cache first 
    const cachedSections = await getGlobalSections(courseCode);

    if (cachedSections) {
      // cache hit - return cached data
      return res.status(200).json({
        source: "cache",
        data: cachedSections,
      });
    }

    // cache miss - fetch fresh data
    console.log(
      `Cache miss or refresh requested, fetching fresh sections for ${courseCode}`
    );
    const sections = await fetchCourseSections(courseCode);

    // store in cache for future requests
    await storeGlobalSections(courseCode, sections);

    res.status(200).json({
      source: "live",
      data: sections,
    });
    
  } catch (error) {
    console.error(`Error fetching sections for ${courseCode}:`, error);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
}
