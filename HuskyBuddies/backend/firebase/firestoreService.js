import { getNextColor } from "@/utils/transform/courseTransform";
import { db } from "./firebaseConfig";
import { doc, setDoc, deleteDoc, getDocs, collection, updateDoc, getDoc } from "firebase/firestore";

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

/**
 * Stores a new course in Firestore under the user's document
 * @param {string} userId - ID of the user
 * @param {Course} course - The course to be stored
 */
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

  } catch (error) {
    console.error("Error storing course:", error);
  }
};

/**
 * Retrieves all stored courses for a specific user
 * @param {string} userId - ID of the user 
 * @returns {Promise<Course[]>} - An array of courses
 */
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

/**
 * Deletes a course from Firestore by its ID
 * @param {string} userId - ID of the user
 * @param {string} courseId - ID of the course to be deleted
 */
export const deleteCourse = async (userId, courseId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "courses", courseId));
    
  } catch (error) {
    console.error("Error deleting course:", error)
  }
}

/**
 * Update or create a user's profile in Firestore.
 * @param {string} uid - The user's unique identifier.
 * @param {Promise<Object>} profileData - The user's profile data.
 */

export const updateUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, profileData, { merge: true });
    console.log("User profile updated successfully");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Retrieves a specific user's profile from Firestore.
 * @param {string} uid - The user's unique identifier.
 * @returns {Promise<Object>} - The user's profile data.
 */

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // get current user data
      return userDoc.data();
    } 
    
    else {
      console.log("No such user!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Updates a specific user's settings in Firestore.
 * @param {string} uid - The user's unique identifier.
 * @param {Object} newSettings - The user's new settings.
 */
export const updateUserSettings = async (uid, newSettings) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // get current user data
      const userData = userDoc.data();

      // get current settings OR initialize empty object if it doesnt exist
      const currentSettings = userData.settings || {};

      // merge the current settings with new settings
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      // update settings field
      await updateDoc(userRef, { settings: updatedSettings });
      console.log("User settings updated successfully");
    } 
    
    else {
      console.log("No such user!");
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

/**
 * Retrieves a specific user's settings from Firestore.
 * @param {string} uid - The user's unique identifier.
 * @returns {Promise<Object>} - The user's settings.
 */
export const getUserSettings = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // return settings object or default
      const userData = userDoc.data();
      return userData.settings || {
        notificationsEnabled: false,
        darkModeEnabled: false,
        textSize: 16
      };
    } 
    
    else {
      console.log("No such user!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user settings:", error);
    throw error;
  }
};

/**
 * Updates a specific user's profile picture URL in Firestore.
 * A separate API call here because pictures are big and errors could arise that might not have to do with the other parts of profile.
 * @param {string} uid - The user's unique identifier.
 * @param {string} pictureUrl - The URL of the user's profile picture.
 */
export const updateProfilePicture = async (uid, pictureUrl) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { profilePicture: pictureUrl });
    console.log("Profile picture updated successfully");
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
};