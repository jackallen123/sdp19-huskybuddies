/**
 * course.ts
 * defines the interfaces for Course and Section
 */

export interface Course {
  id: string;
  name: string;
  // location: string;
  section: string;
  instructor: string;
  days: string[];
  startTime: string;
  endTime: string;
  color: string;
}

export interface Section {
  sectionNumber: string;
  meets: string;
  instructor: string;
}
