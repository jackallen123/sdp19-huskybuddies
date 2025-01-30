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
  title: string; // Standardizing with 'title' instead of 'name'
  date: string;
  location?: string; // Keeping 'location' optional
  description?: string; // Merging field from `main`
  isadded?: boolean; // Optional field for tracking added events
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

// messages-related types and data (from feature/messaging-page)
export interface ChatData {
  id: string;
  firstName: string;
  lastName: string;
  lastMessage: string;
  time: string;
  profilePicture: string;
  message: string;
  sender: string;
}

// study session-related types and data (from main)
export interface StudySession {
  id: number;
  title: string;
  date: string;
  friends: string[];
}