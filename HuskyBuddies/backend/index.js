const express = require('express');
const { getMappingMatches, searchBySection, SearchParts, searchCourse } = require('@ilefa/husky');

const app = express();
const port = 3000;

// endpoint to fetch courses
app.get('/courses', async (req, res) => {
    try {
        // fetch courses from Husky static course mappings
        const courses = getMappingMatches('name', () => true);

        // simplify structure for frontend
        const formattedCourses = courses.map(course =>({
            name: course.name,
            catalogName: course.catalogName,
        }));

        res.status(200).json(formattedCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// endpoint to fetch sections for a specific course
app.get('/courses/:courseId/sections', async (req, res) => {
    try {
      const { courseId } = req.params;
  
      // fetch the course and retrieve only the sections
      const courseSections = await searchCourse(courseId, 'storrs', false, [SearchParts.SECTIONS]);
  
      // simplifying structure for frontend consumption

      /* TODO

      Need the following:
      - Term (semester)
      - Section
      - Location
      - Instructor
      - Schedule (meeting times)

      */
      const formattedSections = courseSections.sections.map(section => ({
        sectionId: section.section,
        meetingTimes: section.meetingTimes,
        instructor: section.instructor,

      }));
      
      res.status(200).json(formattedSections);
    } catch (error) {
      console.error(`Error fetching sections for course ${courseId}:`, error);
      res.status(500).json({ message: 'Error fetching course sections' });
    }
  });

// Starting the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});