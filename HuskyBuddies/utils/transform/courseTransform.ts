/**
 * courseTransform.ts
 * contains utility functions for transforming and parsing course data
 */

import { Course, Section } from "../types/course";

const COLORS = [
  "#FF6F61", // Coral
  "#6B5B93", // Slate Blue
  "#88B04B", // Olive Green
  "#F7CAC9", // Light Pink
  "#92A8D1", // Light Blue
  "#955251", // Deep Red
  "#B9B3C2", // Lavender Gray
  "#FFD700", // Gold
  "#40E0D0", // Turquoise
  "#FF7F50", // Coral Red
];

let colorIndex = 0;

/**
 * assigns the next available color from the COLORS array to a course
 * @param usedColors - an array of colors that have already been used
 * @returns {string} - the next available color
 */
export const getNextColor = (usedColors: string[]): string => {
  // filter available colors based on the used colors
  const availableColors = COLORS.filter((color) => !usedColors.includes(color));

  // assign the next color from the available pool and cycle through if necessary
  const color = availableColors[colorIndex % availableColors.length];
  colorIndex = (colorIndex + 1) % COLORS.length;
  return color;
};

const dayMappings: { [key: string]: string } = {
  M: "MON",
  T: "TUE",
  W: "WED",
  Th: "THU",
  F: "FRI",
};

/**
 * parses the "meets" string from a course section to find meeting days
 * @param meetString - the "meets" string from the course section
 * @returns {string[]} - an array of weekdays
 */
export const parseDays = (meetString: string): string[] => {
  const days: string[] = [];
  let remaining = meetString;

  while (remaining.length > 0) {
    let matched = false;
    // check for "Th" first, then single letters
    if (remaining.startsWith("Th")) {
      days.push(dayMappings["Th"]);
      remaining = remaining.slice(2);
      matched = true;
    } else {
      for (const [key, value] of Object.entries(dayMappings)) {
        if (remaining.startsWith(key) && key !== "Th") {
          days.push(value);
          remaining = remaining.slice(key.length);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // skip any character that doesn't match a day
      remaining = remaining.slice(1);
    }
  }

  return days;
};

/**
 * parses the "meets" string from a course section to find meeting times
 * @param meetString - the "meets" string from the course section
 * @returns { startTime: string, endTime: string} - the start and end times of the course section
 */
export const parseTime = (
  meetString: string
): { startTime: string; endTime: string } => {
  const timePattern = /(\d{1,2}):?(\d{2})?([ap])?-?(\d{1,2})?:?(\d{2})?([ap])?/;
  const match = meetString.match(timePattern);

  if (!match) {
    return { startTime: "", endTime: "" };
  }

  const formatTime = (
    hour: string,
    minute: string = "00",
    meridiem: string
  ): string => {
    let formattedHour = parseInt(hour);
    const isPM = meridiem === "p";

    // convert to 12-hour format for display
    if (isPM && formattedHour !== 12) {
      formattedHour += 12;
    } else if (!isPM && formattedHour === 12) {
      formattedHour = 0;
    }

    // format in 12-hour style (1 - 12 range)
    const displayHour = formattedHour % 12 || 12;
    const displayMinute = minute.padStart(2, "0");

    // append AM/PM
    return `${displayHour}:${displayMinute} ${isPM ? "PM" : "AM"}`;
  };

  // extract start and end time components from the regex match
  const startHour = match[1];
  const startMinute = match[2] || "00"; 
  const startMeridiem = match[3];
  const endHour = match[4] || startHour; // use start hour if end is missing
  const endMinute = match[5] || "00"; 
  const endMeridiem = match[6] || startMeridiem; // use start meridiem if end is missing

  // format start and end times
  const startTime = formatTime(startHour, startMinute, startMeridiem);
  const endTime = formatTime(endHour, endMinute, endMeridiem);

  return {
    startTime,
    endTime,
  };
};

/**
 * transforms a course section into a Course object
 * @param courseCode - the code of the course
 * @param section - the course section object
 * @param location - the location of the course
 * @returns {Course} - the transformed course object
 */
export const transformSectionToCourse = (
  courseCode: string,
  section: Section,
  // location: string
): Course => {
  const { startTime, endTime } = parseTime(section.meets);
  const days = parseDays(section.meets);

  return {
    id: `${courseCode}-${section.sectionNumber}`,
    name: courseCode,
    // location,
    section: section.sectionNumber,
    days,
    startTime,
    endTime,
    color: "", // color to be assigned in courseStorage
  };
};
