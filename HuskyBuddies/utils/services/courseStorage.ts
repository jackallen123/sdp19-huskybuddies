/**
 * courseStorage.ts
 * handles the storage and retrieval of course data using AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Course } from "../../app/types/course";
import { getNextColor } from "../transform/courseTransform";

const COURSES_STORAGE_KEY = "@courses";

/**
 * stores a new course in AsyncStorage
 * @param course - the course to be stored
 * @throws {Error} if a course with the same ID already exists
 */
export const storeCourse = async (course: Course): Promise<void> => {
  try {
    const existingCoursesJson = await AsyncStorage.getItem(COURSES_STORAGE_KEY);
    const existingCourses: Course[] = existingCoursesJson
      ? JSON.parse(existingCoursesJson)
      : [];

    // check if course already exists
    const courseExists = existingCourses.some((c) => c.id === course.id);
    if (courseExists) {
      throw new Error("Course section already exists in schedule");
    }

    // collect colors of existing courses
    const usedColors = existingCourses.map((course) => course.color);

    // assign a unique color that is not already in use
    course.color = getNextColor(usedColors);

    const updatedCourses = [...existingCourses, course];
    await AsyncStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify(updatedCourses)
    );
  } catch (error) {
    throw error;
  }
};

/**
 * retrieves all the stored courses from AsyncStorage
 * @returns {Promise<Course[]>} - an array of courses
 */
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesJson = await AsyncStorage.getItem(COURSES_STORAGE_KEY);
    return coursesJson ? JSON.parse(coursesJson) : [];
  } catch (error) {
    console.error("Error retrieving courses:", error);
    return [];
  }
};

/**
 * deletes a course from AsyncStorage by its ID
 * @param courseId - the id of the course to be deleted
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const existingCoursesJson = await AsyncStorage.getItem(COURSES_STORAGE_KEY);
    const existingCourses: Course[] = existingCoursesJson
      ? JSON.parse(existingCoursesJson)
      : [];

    const updatedCourses = existingCourses.filter(
      (course) => course.id !== courseId
    );
    await AsyncStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify(updatedCourses)
    );
  } catch (error) {
    throw error;
  }
};
