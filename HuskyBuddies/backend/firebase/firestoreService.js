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
  onSnapshot,
  Timestamp,
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
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, {
      firstName,
      lastName,
      email,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error adding user to database:", error)
  }
}

/**
 * Deletes a user from the Firestore database.
 * @param {string} uid - The user's unique identifier.
 */
export const deleteUserFromDatabase = async (uid) => {
  try {
    const userRef = doc(db, "users", uid)
    await deleteDoc(userRef)
  } catch (error) {
    console.error("Error deleting user from database:", error)
  }
}

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
    const userCoursesRef = doc(db, "users", userId, "courses", course.id)

    // fetch existing courses to help determine unique color
    const coursesSnapshot = await getDocs(collection(db, "users", userId, "courses"))
    const existingCourses = coursesSnapshot.docs.map((doc) => doc.data())

    // assign a unique color
    const usedColors = existingCourses.map((course) => course.color)
    course.color = getNextColor(usedColors)

    await setDoc(userCoursesRef, course)
  } catch (error) {
    console.error("Error storing course:", error)
  }
}

/**
 * Retrieves all stored courses for a specific user
 * @param {string} userId - ID of the user
 * @returns {Promise<Course[]>} - An array of courses
 */
export const getAllCourses = async (userId) => {
  try {
    const coursesSnapshot = await getDocs(collection(db, "users", userId, "courses"))

    return coursesSnapshot.docs.map((doc) => {
      const data = doc.data()

      return {
        id: doc.id,
        name: data.name || "",
        section: data.section || "",
        days: data.days || [],
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        color: data.color || "#FFFFFF",
      }
    })
  } catch (error) {
    console.error("Error retrieving courses:", error)
    return []
  }
}

/**
 * Deletes a course from Firestore by its ID
 * @param {string} userId - ID of the user
 * @param {string} courseId - ID of the course to be deleted
 */
export const deleteCourse = async (userId, courseId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "courses", courseId))
  } catch (error) {
    console.error("Error deleting course:", error)
  }
}

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
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, profileData, { merge: true });
    console.log("User profile updated successfully");
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

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
    console.error("Error getting user profile:", error)
    throw error
  }
}

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
    console.error("Error updating user settings:", error)
    throw error
  }
}

/**
 * Retrieves a specific user's settings from Firestore.
 * @param {string} uid - The user's unique identifier.
 * @returns {Promise<Object|null>} - The user's settings object or null if no user found.
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
    console.error("Error getting user settings:", error)
    throw error
  }
}

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
    console.error("Error updating profile picture:", error)
    throw error
  }
}

/**
 * Fetch all users from Firestore
 */
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
};

/**
 * Send a friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const sendFriendRequest = async (currentUserId, targetUserId) => {
  try {
    const requestRef = doc(db, "friendRequests", `${currentUserId}_${targetUserId}`)
    await setDoc(requestRef, { from: currentUserId, to: targetUserId, status: "pending" })
  } catch (error) {
    console.error("Error sending friend request:", error)
  }
}

/**
 * Cancel a sent friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const cancelFriendRequest = async (currentUserId, targetUserId) => {
  try {
    const requestRef = doc(db, "friendRequests", `${currentUserId}_${targetUserId}`)
    await deleteDoc(requestRef)
  } catch (error) {
    console.error("Error canceling friend request:", error)
  }
}

/**
 * Accept a friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const acceptFriendRequest = async (currentUserId, targetUserId) => {
  try {
    // Add to friends list
    const userFriendsRef = doc(db, "users", currentUserId, "friends", targetUserId)
    await setDoc(userFriendsRef, { friendId: targetUserId })

    const targetFriendsRef = doc(db, "users", targetUserId, "friends", currentUserId)
    await setDoc(targetFriendsRef, { friendId: currentUserId })

    // Remove from requests
    const requestRef = doc(db, "friendRequests", `${targetUserId}_${currentUserId}`)
    await deleteDoc(requestRef)
  } catch (error) {
    console.error("Error accepting friend request:", error)
  }
}

/**
 * Reject a friend request
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const rejectFriendRequest = async (currentUserId, targetUserId) => {
  try {
    const requestRef = doc(db, "friendRequests", `${targetUserId}_${currentUserId}`)
    await deleteDoc(requestRef)
  } catch (error) {
    console.error("Error rejecting friend request:", error)
  }
}

/**
 * Remove a friend
 * @param {string} currentUserId - The user's and request sender's unique identifier.
 * @param {string} targetUserId - The request recipient's unique identifier.
 */
export const removeFriend = async (currentUserId, targetUserId) => {
  try {
    const userFriendRef = doc(db, "users", currentUserId, "friends", targetUserId)
    await deleteDoc(userFriendRef)

    const targetFriendRef = doc(db, "users", targetUserId, "friends", currentUserId)
    await deleteDoc(targetFriendRef)
  } catch (error) {
    console.error("Error removing friend:", error)
  }
};

/*
 * SCHEDULER DB INTERACTIONS
 */
/**
 * Retrieves currently logged-in user's UID.
 * @returns {Promise<string | null>} - The user's UID, null if not logged in.
 */
export const getUserId = async () => {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser
    return currentUser ? currentUser.uid : null
  } catch (error) {
    console.error("Error fetching UID:", error)
    return null
  }
}

/**
 * Fetches user's first and last name using their UID.
 * @param {string} uid - The user's UID.
 * @returns {Promise<string | null>} - The user's full name, null if not found.
 */
export const getFullName = async (uid) => {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      return `${userData.firstName} ${userData.lastName}`
    } else {
      console.log("User does not exist.")
      return null
    }
  } catch (error) {
    console.error("Error fetching user name:", error)
    return null
  }
}

/**
 * Adds a new event to a specific user's Firestore database.
 * @param {string} userId - The ID of the current user.
 * @param {string} eventId - The event ID.
 * @param {string} title - The title of the event.
 * @param {Timestamp} date - The date and time of the event.
 * @param {string} description - The description of the event.
 * @param {boolean} isadded - Whether the event is added to the calendar.
 */
export const AddEventToDatabase = async (userId, eventId, title, date, description, isadded) => {
  try {
    // Generate a unique ID if one is not provided
    const finalEventId = eventId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Add to user's events collection
    const userEventRef = doc(db, "users", userId, "events", finalEventId)
    await setDoc(userEventRef, {
      title: title,
      date: date,
      description: description,
      isadded: isadded,
      createdBy: userId,
    })

    // Also add to allEvents collection for global visibility
    const allEventsRef = doc(db, "users", userId, "allEvents", finalEventId)
    await setDoc(allEventsRef, {
      title: title,
      date: date,
      description: description,
      isadded: isadded,
      createdBy: userId,
    })

    console.log(`Event added successfully: ${title} with ID: ${finalEventId}`)
    return finalEventId // Return the ID for reference
  } catch (error) {
    console.error("Error adding event to database:", error)
    throw error
  }
}

/**
 * Deletes an event from a specific user's Firestore database.
 * @param {string} userId - The ID of the current user.
 * @param {string} eventId - The ID of the event.
 */
export const DeleteEventFromDatabase = async (userId, eventId) => {
  try {
    // Delete from user's events collection
    const userEventRef = doc(db, "users", userId, "events", eventId)
    await deleteDoc(userEventRef)

    // Also delete from allEvents collection
    const allEventsRef = doc(db, "users", userId, "allEvents", eventId)
    await deleteDoc(allEventsRef)

    console.log(`Event deleted successfully: ${eventId}`)
  } catch (error) {
    console.error("Error deleting event from database:", error)
    throw error
  }
}

/**
 * Fetches events for a specific user from Firestore (Real-time listener).
 * @param {string} userId - The ID of the current user.
 * @param {function} setEvents - A function to update the state with the fetched events.
 */
export const FetchEventsFromDatabase = (userId, setEvents) => {
  if (!userId) {
    console.error("Cannot fetch events: No user ID provided")
    return () => {} // Return empty unsubscribe function
  }

  const userEventsRef = collection(db, "users", userId, "events")

  return onSnapshot(
    userEventsRef,
    (snapshot) => {
      const eventsList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: data.isadded,
          createdBy: data.createdBy || userId, // Ensure createdBy is set
        }
      })
      console.log(`Fetched ${eventsList.length} events for user ${userId}`)
      setEvents(eventsList)
    },
    (error) => {
      console.error("Error fetching events:", error)
    },
  )
}

/**
 * Fetches events for all users and stores them in the 'allEvents' collection under each user.
 * @param {string} userId - The ID of the current user (for logging purposes).
 * @param {function} setEvents - A function to update the state with the fetched events.
 */
export const SyncAllEventsFromDatabase = async (userId, setEvents) => {
  try {
    console.log(`User ${userId} is syncing all events`)

    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const allEvents = []

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const creatorId = userDoc.id

      // Skip the current user - we already have their events from the listener
      if (creatorId === userId) {
        console.log(`Skipping current user ${userId} during sync`)
        continue
      }

      // Get user's events
      const userEventsRef = collection(db, "users", creatorId, "events")
      const eventsSnapshot = await getDocs(userEventsRef)

      console.log(`Found ${eventsSnapshot.docs.length} events for user ${creatorId}`)

      // Process each event
      for (const eventDoc of eventsSnapshot.docs) {
        const data = eventDoc.data()
        const eventId = eventDoc.id

        // Validate event data
        if (!data.title || !data.date || !data.description) {
          console.warn(`Skipping event with missing data: ${eventId}`)
          continue
        }

        // Create event object
        const event = {
          id: eventId,
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: false, // Default to false for other users
          createdBy: creatorId,
        }

        // Add to our collection array
        allEvents.push(event)

        // Store in allEvents collection with the SAME ID as the original event
        const allEventsRef = doc(db, "users", userId, "allEvents", eventId)
        await setDoc(allEventsRef, {
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: false,
          createdBy: creatorId,
        })
      }
    }

    console.log(`Total events synced: ${allEvents.length}`)

    // Update state with all events
    if (setEvents) {
      setEvents(allEvents)
    }

    return allEvents
  } catch (error) {
    console.error("Error syncing all events:", error)
    throw error
  }
}

export const FetchAllEventsFromDatabase = (userId, setEvents) => {
  if (!userId) {
    console.error("Cannot fetch all events: No user ID provided")
    return () => {} // Return empty unsubscribe function
  }

  // This should fetch from the user's own allEvents subcollection
  const allEventsRef = collection(db, "users", userId, "allEvents")

  return onSnapshot(
    allEventsRef,
    (snapshot) => {
      const eventsList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: data.isadded,
          createdBy: data.createdBy,
        }
      })
      console.log(`Fetched ${eventsList.length} events for user ${userId}`)
      setEvents(eventsList)
    },
    (error) => {
      console.error("Error fetching all events:", error)
    },
  )
}

/**
 * Adds a new study session to the Firestore database.
 * @param {string} userId
 * @param {string} studySessionId
 * @param {string} studySessionTitle
 * @param {Time} studySessionDate
 * @param {string[]} studySessionFriends
 */
export const AddStudySessionToDatabase = async (
  userId,
  studySessionId,
  studySessionTitle,
  studySessionDate,
  studySessionFriends,
) => {
  // Generate a unique ID if one is not provided
  const sessionId = studySessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const userStudySessionsRef = doc(db, "users", userId, "studySessions", sessionId)
  await setDoc(userStudySessionsRef, {
    title: studySessionTitle,
    date: studySessionDate,
    friends: studySessionFriends,
    createdBy: userId,
  })

  return sessionId // Return the ID for reference
}

/**
 * Deletes a study session from the Firestore database under the user's sub-collection.
 * @param {string} userId - The ID of the current user.
 * @param {string} studySessionId - The ID of the study session.
 */
export const DeleteStudySessionFromDatabase = async (userId, studySessionId) => {
  try {
    const userStudySessionsRef = doc(db, "users", userId, "studySessions", studySessionId)
    await deleteDoc(userStudySessionsRef)
  } catch (error) {
    console.error("Error deleting study session from database:", error)
  }
}

/**
 * Fetches study sessions from Firestore for the current user (Real-time listener).
 * @param {string} userId
 * @param {function} setSessions
 */
export const FetchStudySessionsFromDatabase = (userId, setSessions) => {
  const userStudySessionsRef = collection(db, "users", userId, "studySessions")

  return onSnapshot(userStudySessionsRef, (snapshot) => {
    const sessionsList = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        date: data.date,
        friends: data.friends,
        createdBy: data.createdBy,
      }
    })
    setSessions(sessionsList)
  })
}

