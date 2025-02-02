import { getNextColor } from "@/utils/transform/courseTransform";
import { db } from "./firebaseConfig";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

/**
 * Adds a new user to the Firestore database.
 * @param {string} uid - The user's unique identifier.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} email - The user's email.
 */
export const addUserToDatabase = async (uid, firstName, lastName, email) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      firstName,
      lastName,
      email,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error("Error adding user to database:", error);
  }
};

/**
 * Deletes a user from the Firestore database.
 * @param {string} uid - The user's unique identifier.
 */
export const deleteUserFromDatabase = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user from database:", error);
  }
};

export const storeCourse = async (userId, course) => {
  try {
    const userCoursesRef = doc(db, "users", userId, "courses", course.id);

    // fetch existing courses to help determine unique color
    const coursesSnapshot = await getDocs(collection(db, "users", userId, "courses"));
    const existingCourses = coursesSnapshot.docs.map(doc => doc.data());

    // assign a unique color
    const usedColors = existingCourses.map(course => course.color);
    course.color = getNextColor(usedColors);

    await setDoc(userCoursesRef, course);
    console.log("Course stored in Firebase:", course);
  } catch (error) {
    console.error("Error storing course:", error);
  }
};

export const getAllCourses = async (userId) => {
  try {
    const coursesSnapshot = await getDocs(collection(db, "users", userId, "courses"));
    
    return coursesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id, 
        name: data.name || "",
        section: data.section || "",
        instructor: data.instructor || "",
        days: data.days || [],
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        color: data.color || "#FFFFFF" 
      }
    });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    return [];
  }
};

export const deleteCourse = async (userId, courseId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "courses", courseId));
    console.log("Course deleted from Firestore:", courseId);
  } catch (error) {
    console.error("Error deleting course:", error)
  }
}
