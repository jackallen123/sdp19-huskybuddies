// const axios = require('axios');
// const pdf = require('pdf-parse');
// const fs = require('fs');  

// // function to fetch and parse the PDF file
// async function fetchAndExtractCourses() {
//   try {
//     // fetch the PDF file using axios
//     const response = await axios.get('https://catalog.uconn.edu/pdf/UConn_2024_2025_Undergraduate_Catalog.pdf', {
//       responseType: 'arraybuffer',
//     });
//     const pdfBuffer = response.data;

//     // extract text from the PDF using pdf-parse
//     const pdfData = await pdf(pdfBuffer, { pagerender: limitPages });

//     // process the extracted text and sort courses alphabetically
//     let courseNames = extractCourseNames(pdfData.text);
//     courseNames = courseNames.sort(); // Sorting course names alphabetically

//     // output the course names to a text file
//     fs.writeFileSync('extracted_courses.json', JSON.stringify(courseNames, null, 2), 'utf8');
//     console.log('Courses extracted and written to extracted_courses.json.');

//     return courseNames;
//   } catch (error) {
//     console.error('Error fetching or parsing the PDF:', error);
//     return [];
//   }
// }

// // function to limit the pages to start scraping from page 364
// function limitPages(pageData) {
//   if (pageData.pageIndex < 363) {
//     // ignore pages before 364
//     return '';
//   }
//   return pageData.getTextContent().then((textContent) => {
//     return textContent.items.map((item) => item.str).join(' ');
//   });
// }

// // function to extract course names from the raw PDF text
// function extractCourseNames(pdfText) {
//   const courseNames = [];

//   // regex to match course codes like "ACCT 2001"
//   const courseRegex = /([A-Z]{2,4}\s\d{4}[WEQ]?)\.\s{2}([^.]+)\.\s{2}/g;
//   let match;

//   while ((match = courseRegex.exec(pdfText)) !== null) {
//     const course = {
//       courseId: match[1].trim(),
//       courseName: match[2].trim(),
//     }
//     courseNames.push(course);
//   };

//   return courseNames;
// }

// // call the function
// fetchAndExtractCourses();

import axios from 'axios';
import moment from 'moment';
import cheerio from 'cheerio';
import tableparse from 'cheerio-tableparser';

interface SectionInfo {
    section: string;
    instructor: string;
    schedule: string;
    term: string;
    location: string[];
    enrollment: {
        current: string;
        max: string;
        full: boolean;
    };
}

/**
 * Gets course information for a specific course at Storrs campus
 * @param identifier Course identifier (e.g., "CSE2050")
 * @returns Promise containing section information or null if course not found
 */
export const getCourseInfo = async (identifier: string): Promise<SectionInfo[] | null> => {
    // This regex tests if the identifier follows the pattern of letters followed by numbers
    const COURSE_IDENTIFIER = /^[a-zA-Z]{2,4}[0-9]{4}(?:Q|E|W)*$/;  // Assuming this is the pattern from original code
    
    if (!COURSE_IDENTIFIER.test(identifier))
        return null;
    
    let prefix = identifier.split(/[0-9]/)[0].toUpperCase();
    let number = identifier.split(/[a-zA-Z]{2,4}/)[1];

    // NOTE: getCatalogUrl would need to be implemented or imported
    // It should return the URL for the course catalog page
    let target = getCatalogUrl(prefix, number);
    
    let res = await axios
        .get(target)
        .then(res => res.data)
        .catch(_ => null);

    if (!res)
        return null;

    let $ = cheerio.load(res);
    
    tableparse($);
    
    let sections: SectionInfo[] = [];
    let data: string[][] = ($('.tablesorter') as any).parsetable();
    
    if (!data[0]) return null;

    let sectionCount = data[0].length - 1;

    // Start from 1 to skip header row
    for (let i = 1; i < sectionCount + 1; i++) {
        let campus = data[2][i].replace(/&nbsp;/g, ' ').trim();
        
        // Only process Storrs campus sections
        if (campus.toLowerCase() !== 'storrs')
            continue;

        let instructor = data[4][i]
            .replace(/\&nbsp;/g, ' ')
            .replace(/<br\s*\/*>/g, ' | ')
            .split(' | ')
            .map(ent => ent.split(', ').reverse().join(' '))
            .join(' & ');

        let section = data[5][i];
        let schedule = data[7][i];
        schedule = schedule.substring(0, schedule.length - 4);
        
        let location: string[] = [];
        let locationData = data[8][i];
        
        // Parse location data
        if (locationData?.includes('classrooms.uconn.edu')) {
            let locationEl = cheerio.load(locationData);
            locationEl('a').each((_, el) => {
                location.push($(el).text());
            });
        } else {
            location.push(locationData);
        }

        let enrollment = data[9][i];
        let spaces = enrollment.split('<')[0];
        let current = spaces.split('/')[0];
        let seats = spaces.split('/')[1];

        sections.push({
            section,
            instructor,
            schedule,
            term: data[1][i],
            location,
            enrollment: {
                current,
                max: seats,
                full: parseInt(current) >= parseInt(seats)
            }
        });
    }

    return sections;
};

export const getCatalogUrl = (prefix: string, number: string) => {
    let num = parseInt(number.replace(/[^0-9]/g, ''));
    if (num > 5000 && (prefix !== 'PHRX' || (prefix === 'PHRX' && num < 5199)))
        return `https://gradcatalog.uconn.edu/course-descriptions/course/${prefix}/${number}/`;
    return `https://catalog.uconn.edu/directory-of-courses/course/${prefix}/${number.length === 3 ? ' ' + number : number}/`;
}

console.log(getCourseInfo('CSE 1010'))