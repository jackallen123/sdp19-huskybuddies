import { getNextColor } from "../../utils/transform/courseTransform";
import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  updateDoc,
  getDoc,
  onSnapshot,
  Timestamp,
  query,
  where,
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
  * COURSE CRON JOB
*/


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
 * Updates a specific user's profile in Firestore.
 * @param {string} uid - The user's unique identifier.
 * @param {Object} profileData - The user's profile data.
 */

export const updateUserProfile = async (uid, profileData) => {
  try {
    // create or overwrite the profile document in the "userProfile" subcollection
    const userProfileRef = doc(db, "users", uid, "userProfile", "profile");
    await setDoc(userProfileRef, profileData);
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
    const userProfileRef = doc(db, "users", uid, "userProfile", "profile");
    const userProfileDoc = await getDoc(userProfileRef);

    if (userProfileDoc.exists()) {
      return userProfileDoc.data();
    } else {
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
    // create or overwrite the settings document in the "settings" subcollection
    const settingsRef = doc(db, "users", uid, "settings", "settings");
    await setDoc(settingsRef, newSettings, { merge: true });
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

/**
 * Retrieves a specific user's settings from Firestore.
 * @param {string} uid - The user's unique identifier.
 * @returns {Promise<Object|null>} - The user's settings object or null if no user found.
 */
export const getUserSettings = async (uid) => {
  try {
    const settingsRef = doc(db, "users", uid, "settings", "settings");
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    } else {
      // return to defaults if no data found
      return {
        notificationsEnabled: false,
        darkModeEnabled: false,
        textSize: 16,
      };
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
    const userProfileRef = doc(db, "users", uid, "userProfile", "profile");
    await setDoc(userProfileRef, { profilePicture: pictureUrl }, { merge: true });
    console.log("Profile picture updated successfully");
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
};

/**
 * Fetch all users from Firestore
 */
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Retrieve the friend list of a user
 * @param {string} uid - The user's unique identifier.
 */
export const getFriends = async (uid) => {
  try {
    const friendsSnapshot = await getDocs(collection(db, "users", uid, "friends"));
    return friendsSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
};

/**
 * Retrieve incoming friend requests for a user
 * @param {string} uid - The user's unique identifier.
 */
export const getIncomingFriendRequests = async (uid) => {
  try {
    const requestsQuery = query(collection(db, "friendRequests"), where("to", "==", uid));
    const requestsSnapshot = await getDocs(requestsQuery);
    return requestsSnapshot.docs.map(doc => doc.data().from);
  } catch (error) {
    console.error("Error fetching incoming friend requests:", error);
    return [];
  }
};

/**
 * Retrieve outgoing friend requests for a user
 * @param {string} uid - The user's unique identifier.
 */
export const getOutgoingFriendRequests = async (uid) => {
  try {
    const requestsQuery = query(collection(db, "friendRequests"), where("from", "==", uid));
    const requestsSnapshot = await getDocs(requestsQuery);
    return requestsSnapshot.docs.map(doc => doc.data().to);
  } catch (error) {
    console.error("Error fetching outgoing friend requests:", error);
    return [];
  }
};

/**
 * Send a friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const sendFriendRequest = async (currentUserId, targetUserId) => {
  try {
    const requestRef = doc(db, "friendRequests", `${currentUserId}_${targetUserId}`);
    await setDoc(requestRef, { from: currentUserId, to: targetUserId, status: "pending" });
  } catch (error) {
    console.error("Error sending friend request:", error);
  }
};

/**
 * Cancel a sent friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const cancelFriendRequest = async (currentUserId, targetUserId) => {
  try {
    const requestRef = doc(db, "friendRequests", `${currentUserId}_${targetUserId}`);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error("Error canceling friend request:", error);
  }
};

/**
 * Accept a friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const acceptFriendRequest = async (currentUserId, targetUserId) => {
  try {
    // Add to friends list
    const userFriendsRef = doc(db, "users", currentUserId, "friends", targetUserId);
    await setDoc(userFriendsRef, { friendId: targetUserId });

    const targetFriendsRef = doc(db, "users", targetUserId, "friends", currentUserId);
    await setDoc(targetFriendsRef, { friendId: currentUserId });

    // Remove from requests
    const requestRef = doc(db, "friendRequests", `${targetUserId}_${currentUserId}`);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error("Error accepting friend request:", error);
  }
};

/**
 * Reject a friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const rejectFriendRequest = async (currentUserId, targetUserId) => {
  try {
    const requestRef = doc(db, "friendRequests", `${targetUserId}_${currentUserId}`);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error("Error rejecting friend request:", error);
  }
};

/**
 * Remove a friend
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const removeFriend = async (currentUserId, targetUserId) => {
  try {
    const userFriendRef = doc(db, "users", currentUserId, "friends", targetUserId);
    await deleteDoc(userFriendRef);

    const targetFriendRef = doc(db, "users", targetUserId, "friends", currentUserId);
    await deleteDoc(targetFriendRef);
  } catch (error) {
    console.error("Error removing friend:", error);
  }
};

/**
 * Retrieves all courses for a specific user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} - An array of course objects
 */
export const getUserCourses = async (userId) => {
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
        color: data.color || "#FFFFFF",
      };
    });
  } catch (error) {
    console.error("Error retrieving user courses:", error);
    return [];
  }
};

/*
  * EVENTS DB INTERACTIONS
*/
/**
 * Adds a new event to the Firestore database.
 * @param {string} Eventid
 * @param {string} Eventtitle
 * @param {Time} Eventdate
 * @param {string} Eventdescription
 * @param {boolean} Eventocalendar
 */
export const AddEventToDatabase = async (
  Eventid,
  Eventtitle,
  Eventdate,
  Eventdescription,
  Eventocalendar
) => {
  try {
    const userRef = doc(db, "Events", Eventid);
    await setDoc(userRef, {
      title: Eventtitle,
      date: Eventdate,
      description: Eventdescription,
      isadded: Eventocalendar,
    });
  } catch (error) {
    console.error("Error adding event to database:", error);
  }
};


/**
 * Deletes an event from the Firestore database.
 * @param {string} Eventid
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
 * @param {string} Studysessionid
 * @param {string} Studysessiontitle
 * @param {Time} Studysessiondate
 * @param {string[]} Studysessionfriends
 */

export const AddStudySessionToDatabase = async (
  Studysessionid,
  title,
  date,
  friends
) => {
  try {
    const userRef = doc(db, "StudySession", Studysessionid);
    await setDoc(userRef, {
      title: title,         
      date: date,                                   
      friends: friends,     
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
    const userRef = doc(db, "StudySession", Studysessionid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting study session from database:", error);
  }
};

/**
 * Fetches events from Firestore (Real-time listener).
 * @param {function} setEvents 
 */
export const FetchEventsFromDatabase = (setEvents) => {
  const eventsRef = collection(db, "Events");

  return onSnapshot(eventsRef, (snapshot) => {
    const eventsList = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date,
        description: data.description,
        isadded: data.isadded,
      };
    });
    setEvents(eventsList);
  });
};

/**
 * Fetches study sessions from Firestore (Real-time listener).
 * @param {function} setSessions 
 */
export const FetchStudySessionsFromDatabase = (setSessions) => {
  const sessionsRef = collection(db, "StudySession");

  return onSnapshot(sessionsRef, (snapshot) => {
    const sessionsList = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date, 
        friends: data.friends
      };
    });
    setSessions(sessionsList);
  });

};