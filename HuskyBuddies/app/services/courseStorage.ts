import AsyncStorage from "@react-native-async-storage/async-storage";
import { Course } from "../types/course";
import { getNextColor } from "../utils/courseTransform"

const COURSES_STORAGE_KEY = "@courses";

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
    const usedColors = existingCourses.map(course => course.color);

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

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesJson = await AsyncStorage.getItem(COURSES_STORAGE_KEY);
    return coursesJson ? JSON.parse(coursesJson) : [];
  } catch (error) {
    console.error("Error retrieving courses:", error);
    return [];
  }
};

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
