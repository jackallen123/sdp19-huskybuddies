// mock Database File

// user related types and data
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// event-related types and data
export interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
}

// study Buddy related types and data
export interface StudyBuddy {
  id: number;
  name: string;
  sharedClasses: number;
  profilePicture: string;
}

// resource-related types and data
export interface ResourceItem {
  name: string;
  url: string;
}

// course-related types and data
export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  section: string;
  color: string;
  startTime: string;
  endTime: string;
  days: string[];
}

// section-related types and data
export interface Section {
  sectionNumber: string;
  meets: string;
  instructor: string;
}
