import { Course, Section } from "../types/course";

const COLORS = [
  "#FFB3BA", // Pink
  "#BAFFC9", // Green
  "#BAE1FF", // Blue
  "#FFFFBA", // Yellow
  "#E0B3FF", // Purple
  "#FFD8B3", // Orange
];

let colorIndex = 0;

const getNextColor = (): string => {
  const color = COLORS[colorIndex];
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

export const parseTime = (
  meetString: string
): { startTime: string; endTime: string } => {

  const timePattern = /(\d{1,2}):?(\d{2})?-?(\d{1,2}):?(\d{2})?([ap])([ap])?/;
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
    if (meridiem === "p" && formattedHour !== 12) {
      formattedHour += 12;
    } else if (meridiem === "a" && formattedHour === 12) {
      formattedHour = 0; 
    }
    return `${formattedHour.toString().padStart(2, "0")}:${minute}`;
  };

  const startHour = match[1];
  const startMinute = match[2];
  const endHour = match[3];
  const endMinute = match[4];
  const startMeridiem = match[5];
  const endMeridiem = match[6] || startMeridiem;

  const startTime = formatTime(startHour, startMinute, startMeridiem);
  const endTime = formatTime(endHour, endMinute, endMeridiem);

  console.log("Formatted Start Time:", startTime);
  console.log("Formatted End Time:", endTime);

  return {
    startTime,
    endTime,
  };
};
  
export const transformSectionToCourse = (
  courseCode: string,
  section: Section,
  location: string
): Course => {
  const { startTime, endTime } = parseTime(section.meets);
  const days = parseDays(section.meets);

  return {
    id: `${courseCode}-${section.sectionNumber}`,
    name: courseCode,
    location,
    section: section.sectionNumber,
    days,
    startTime,
    endTime,
    color: getNextColor(),
  };
};
