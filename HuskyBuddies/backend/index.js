const axios = require('axios');
const pdf = require('pdf-parse');
const fs = require('fs');  

// function to fetch and parse the PDF file
async function fetchAndExtractCourses() {
  try {
    // fetch the PDF file using axios
    const response = await axios.get('https://catalog.uconn.edu/pdf/UConn_2024_2025_Undergraduate_Catalog.pdf', {
      responseType: 'arraybuffer',
    });
    const pdfBuffer = response.data;

    // extract text from the PDF using pdf-parse
    const pdfData = await pdf(pdfBuffer, { pagerender: limitPages });

    // process the extracted text and sort courses alphabetically
    let courseNames = extractCourseNames(pdfData.text);
    courseNames = courseNames.sort(); // Sorting course names alphabetically

    // output the course names to a text file
    fs.writeFileSync('extracted_courses.json', JSON.stringify(courseNames, null, 2), 'utf8');
    console.log('Courses extracted and written to extracted_courses.json.');

    return courseNames;
  } catch (error) {
    console.error('Error fetching or parsing the PDF:', error);
    return [];
  }
}

// function to limit the pages to start scraping from page 364
function limitPages(pageData) {
  if (pageData.pageIndex < 363) {
    // ignore pages before 364
    return '';
  }
  return pageData.getTextContent().then((textContent) => {
    return textContent.items.map((item) => item.str).join(' ');
  });
}

// function to extract course names from the raw PDF text
function extractCourseNames(pdfText) {
  const courseNames = [];

  // regex to match course codes like "ACCT 2001"
  const courseRegex = /([A-Z]{2,4}\s\d{4}[WEQ]?)\.\s{2}([^.]+)\.\s{2}/g;
  let match;

  while ((match = courseRegex.exec(pdfText)) !== null) {
    const course = {
      courseId: match[1].trim(),
      courseName: match[2].trim(),
    }
    courseNames.push(course);
  };

  return courseNames;
}

// call the function
fetchAndExtractCourses();
