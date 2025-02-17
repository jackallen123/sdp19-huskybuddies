import { getNextColor } from "@/utils/transform/courseTransform";
import { db } from "./firebaseConfig";
import { doc, setDoc, deleteDoc, getDoc, getDocs, collection, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

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
 * @param {Object} profileData - The user's profile data.
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
    const userDoc = await getDocs(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
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
 * @param {Object} settings - The user's settings.
 */

export const updateUserSettings = async (uid, settings) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { settings });
    console.log("User settings updated successfully");
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
    const userDoc = await getDocs(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().settings || {};
    } else {
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

/**
 * Fetches all students from Firestore.
 * @returns {Promise<Array>} List of student profiles.
 */
export const getAllStudents = async () => {
  try {
    const studentsSnapshot = await getDocs(collection(db, "users"));
    return studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

/**
 * Fetches a specific student's profile from Firestore.
 * @param {string} studentId - The student's ID.
 * @returns {Promise<Object>} The student's profile data.
 */
export const getStudentProfile = async (studentId) => {
  try {
    const studentRef = doc(db, "users", studentId);
    const studentDoc = await getDoc(studentRef);
    return studentDoc.exists() ? studentDoc.data() : null;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
};

/**
 * Fetches a student's buddy list from Firestore.
 * @param {string} studentId - The student's ID.
 * @returns {Promise<Array>} List of buddy IDs.
 */
export const getFriendList = async (studentId) => {
  try {
    const studentRef = doc(db, "users", studentId);
    const studentDoc = await getDoc(studentRef);
    return studentDoc.exists() ? studentDoc.data().buddies || [] : [];
  } catch (error) {
    console.error("Error fetching buddy list:", error);
    return [];
  }
};

/**
 * Sends a friend request to another student.
 * @param {string} studentId - The sender's ID.
 * @param {string} buddyId - The recipient's ID.
 */
export const sendFriendRequest = async (studentId, buddyId) => {
  try {
    const buddyRef = doc(db, "users", buddyId);
    await updateDoc(buddyRef, {
      friendRequests: arrayUnion(studentId),
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
  }
};

/**
 * Accepts a friend request and adds the buddy to the friend list.
 * @param {string} studentId - The acceptor's ID.
 * @param {string} buddyId - The sender's ID.
 */
export const acceptFriendRequest = async (studentId, buddyId) => {
  try {
    const studentRef = doc(db, "users", studentId);
    const buddyRef = doc(db, "users", buddyId);
    
    await updateDoc(studentRef, {
      buddies: arrayUnion(buddyId),
      friendRequests: arrayRemove(buddyId),
    });
    
    await updateDoc(buddyRef, {
      buddies: arrayUnion(studentId),
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
  }
};

/**
 * Declines a friend request.
 * @param {string} studentId - The recipient's ID.
 * @param {string} buddyId - The sender's ID.
 */
export const declineFriendRequest = async (studentId, buddyId) => {
  try {
    const studentRef = doc(db, "users", studentId);
    await updateDoc(studentRef, {
      friendRequests: arrayRemove(buddyId),
    });
  } catch (error) {
    console.error("Error declining friend request:", error);
  }
};

/**
 * Removes a buddy from a student's buddy list.
 * @param {string} studentId - The student's ID.
 * @param {string} buddyId - The buddy's ID.
 */
export const removeBuddy = async (studentId, buddyId) => {
  try {
    const studentRef = doc(db, "users", studentId);
    const buddyRef = doc(db, "users", buddyId);
    
    await updateDoc(studentRef, {
      buddies: arrayRemove(buddyId),
    });
    
    await updateDoc(buddyRef, {
      buddies: arrayRemove(studentId),
    });
  } catch (error) {
    console.error("Error removing buddy:", error);
  }
};
