// import express from 'express';
// import { scrapeAllCourses, fetchCourseSections, fetchSectionLocation } from './helper'

// const app = express();
// const port = 3000;
// const host = ''; // put IP address here (server needs to run on IP address instead of localhost to work on mobile device)

// // middleware to parse JSON bodies
// app.use(express.json());

// // endpoint for getting courses
// app.get('/courses', async (_, res) => {
//     try {
//         const courses = await scrapeAllCourses();
//         res.json(courses)
//     } catch (error) {
//         console.error('Error fetching courses:', error)
//         res.status(500).json({ error: 'Failed to fetch courses' });
//     }
// });

// // endpoint to get sections for a specific course
// app.get('/sections/:courseCode', async (req, res) => {
//     try {
//         const { courseCode } = req.params;
//         const sections = await fetchCourseSections(courseCode);
//         res.json(sections);
//     } catch (error) {
//         console.error(`Error fetching sections for ${req.params.courseCode}:`, error)
//         res.status(500).json({ error: 'Failed to fetch sections' });
//     }
// });

// // endpoint to get location for section
// // app.get('/section-location/:courseCode/:sectionNumber', async (req, res) => {
// //     try {
// //         const {courseCode, sectionNumber } = req.params;
// //         const location = await fetchSectionLocation(courseCode, sectionNumber);
// //         if (location) {
// //             res.json({ location })
// //         } else {
// //             res.status(404).json({ error: 'Location not found' })
// //         }
// //     } catch (error) {
// //         console.error(`Error fetching location for ${req.params.courseCode} section ${req.params.sectionNumber}:`, error);
// //         res.status(500).json({ error: 'Failed to fetch location' });
// //     }
// // });

// // runs the server
// app.listen(port, host, () => {
//     console.log(`Server running at http://${host}:${port}`)
// })