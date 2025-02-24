import { getNextColor } from "@/utils/transform/courseTransform";
import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  updateDoc,
  getDoc,
} from "firebase/firestore";


/*
  * USER DB INTERACTIONS
*/

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

/*
  * COURSE DB INTERACTIONS
*/

/**
 * Stores a new course in Firestore under the user's document
 * @param {string} userId - ID of the user
 * @param {Course} course - The course to be stored
 */
export const storeCourse = async (userId, course) => {
  try {
    const userCoursesRef = doc(db, "users", userId, "courses", course.id);

    // fetch existing courses to help determine unique color
    const coursesSnapshot = await getDocs(
      collection(db, "users", userId, "courses")
    );
    const existingCourses = coursesSnapshot.docs.map((doc) => doc.data());

    // assign a unique color
    const usedColors = existingCourses.map((course) => course.color);
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
    const coursesSnapshot = await getDocs(
      collection(db, "users", userId, "courses")
    );

    return coursesSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "",
        section: data.section || "",
        instructor: data.instructor || "",
        days: data.days || [],
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        color: data.color || "#FFFFFF",
      };
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
    console.error("Error deleting course:", error);
  }
};

/*
  * SETTINGS DB INTERACTIONS
*/

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
    } else {
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
      return (
        userData.settings || {
          notificationsEnabled: false,
          darkModeEnabled: false,
          textSize: 16,
        }
      );
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

/*
  * EVENTS DB INTERACTIONS
*/

/**
 * Adds a new event to the Firestore database.
 * @param {number} Eventid
 * @param {string} Eventtitle
 * @param {string} Eventdate
 * @param {string} Eventlocation
 * @param {string} Eventdescription
 * @param {boolean} Eventoncalendar
 */
export const AddEventToDatabase = async (
  Eventid,
  Eventtitle,
  Eventdate,
  Eventlocation,
  Eventdescription,
  Eventoncalendar
) => {
  try {
    const userRef = doc(db, "Events", Eventid);
    await setDoc(userRef, {
      Eventtitle,
      Eventdate,
      Eventlocation,
      Eventdescription,
      Eventoncalendar,
    });
  } catch (error) {
    console.error("Error adding event to database:", error);
  }
};

/**
 * Deletes an event from the Firestore database.
 @param {string} Eventid
 */
export const DeleteEventFromDatabase = async (Eventid) => {
  try {
    const userRef = doc(db, "Events", Eventid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting event from database:", error);
  }
};

/**
 * Adds a new study session to the Firestore database.
 * @param {number} Studysessionid
 * @param {string} Studysessiontitle
 * @param {string} Studysessiondate
 * @param {string[]} StudySessionfriends //need to pull from users matching page
 */
export const AddStudySessionToDatabase = async (
  Studysessionid,
  Studysessiontitle,
  Studysessiondate,
  StudySessionfriends
) => {
  try {
    const userRef = doc(db, "StudySession", Studysessionid);
    await setDoc(userRef, {
      Studysessiontitle,
      Studysessiondate,
      StudySessionfriends,
    });
  } catch (error) {
    console.error("Error adding study session to database:", error);
  }
};

/**
 * Deletes a study session from the Firestore database.
 * @param {string} Studysessionid
 */
export const DeleteStudySessionFromDatabase = async (Studysessionid) => {
  try {
    const userRef = doc(db, "StudySessions", Studysessionid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting study session from database:", error);
  }
};

/*
  * MESSAGES DB INTERACTIONS
*/

/**
 * Sends a message between users and stores it in Firestore.
 * @param {string} senderId - The sender's UID.
 * @param {string} receiverId - The receiver's UID.
 * @param {string} message - The message content.
 */
export const sendMessage = async (senderId, receiverId, message) => {
  try {
    await addDoc(collection(db, "messages"), {
      senderId,
      receiverId,
      message,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

/**
 * Retrieves an array of direct messages sent to logged in user.
 * @param {string} currentUserId - The logged-in user's UID.
 * @returns {Promise<Array>} - Array of messages.
 */
export const getMessages = async (currentUserId) => {
  try {
    const messagesRef = collection(db, "messages");

    const q = query(
      messagesRef,
      where("sentTo", "==", currentUserId), // query messages sent to logged in user
      orderBy("sentAt", "asc") // sort messages so most recent are on top
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({ //return array of firestone docs from previous query
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error retrieving direct messages:", error);
    return [];
  }
};

/**
 * Deletes a message from Firestore.
 * @param {string} messageId - The message ID.
 */
export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, "messages", messageId));
    console.log("Message deleted successfully");
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};