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

// Starting the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});