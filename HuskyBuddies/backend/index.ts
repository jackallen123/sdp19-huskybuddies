import express from 'express';
import { scrapeAllCourses, fetchCourseSections } from './helper'

const app = express();
const port = 3000;
const host = ''; // put IP address here (server needs to run on IP address instead of localhost to work on mobile device)

// middleware to parse JSON bodies
app.use(express.json());

// endpoint for getting courses
app.get('/courses', async (_, res) => {
    try {
        const courses = await scrapeAllCourses();
        res.json(courses)
    } catch (error) {
        console.error('Error fetching courses:', error)
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// endpoint to get sections for a specific course
app.get('/sections/:courseCode', async (req, res) => {
    try {
        const { courseCode } = req.params;
        const sections = await fetchCourseSections(courseCode);
        res.json(sections);
    } catch (error) {
        console.error(`Error fetching sections for ${req.params.courseCode}:`, error)
        res.status(500).json({ error: 'Failed to fetch sections' });
    }
});

// runs the server
app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`)
})