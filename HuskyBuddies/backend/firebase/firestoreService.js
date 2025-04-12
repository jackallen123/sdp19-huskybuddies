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
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  limit,
  Timestamp, 
  writeBatch
} from "firebase/firestore";
import { getAuth } from "firebase/auth";


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

/**
/**
 * Retrieves a user's study preferences from the userProfile subcollection,
 * including both regular and additional study preferences
 * @param {string} userId - ID of the user
 * @returns {Promise<string[]|null>} - Array of study preferences or null if not found
 */
export const getUserStudyPreferences = async (userId) => {
  try {
    const profileDocRef = doc(db, "users", userId, "userProfile", "profile");
    const profileDoc = await getDoc(profileDocRef);
    
    let allPreferences = [];
    
    if (profileDoc.exists()) {
      // Get regular study preferences
      if (profileDoc.data().studyPreferences) {
        allPreferences = [...profileDoc.data().studyPreferences];
      }
      
      // Get additional study preferences and combine them
      if (profileDoc.data().additionalStudyPreferences) {
        allPreferences = [...allPreferences, ...profileDoc.data().additionalStudyPreferences];
      }
      
      return allPreferences.length > 0 ? allPreferences : null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching study preferences:", error);
    return null;
  }
};

/**
 * Retrieves a user's interests from the userProfile subcollection,
 * including both regular and additional interests
 * @param {string} userId - ID of the user
 * @returns {Promise<string[]|null>} - Array of interests or null if not found
 */
export const getUserInterests = async (userId) => {
  try {
    const profileDocRef = doc(db, "users", userId, "userProfile", "profile");
    const profileDoc = await getDoc(profileDocRef);
    
    let allInterests = [];
    
    if (profileDoc.exists()) {
      // Get regular interests
      if (profileDoc.data().interests) {
        allInterests = [...profileDoc.data().interests];
      }
      
      // Get additional interests and combine them
      if (profileDoc.data().additionalInterests) {
        allInterests = [...allInterests, ...profileDoc.data().additionalInterests];
      }
      
      return allInterests.length > 0 ? allInterests : null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching interests:", error);
    return null;
  }
};

/**
 * Retrieves a user's profile picture from the userProfile subcollection
 * @param {string} userId - ID of the user
 * @returns {Promise<string|null>} - The profile picture URL or null if not found
 */
export const getUserProfilePicture = async (userId) => {
  try {
    const profileDocRef = doc(db, "users", userId, "userProfile", "profile");
    const profileDoc = await getDoc(profileDocRef);
    
    if (profileDoc.exists() && profileDoc.data().profilePicture) {
      return profileDoc.data().profilePicture;
    }
    return null;
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return null;
  }
};

/*
  * MESSAGES DB INTERACTIONS
*/

/**
 * Retrieves currently logged-in user's UID.
 * @returns {Promise<string | null>} - The user's UID, null if not logged in.
 */
export const getUserId = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    return currentUser ? currentUser.uid : null;
  } catch (error) {
    console.error("Error fetching UID:", error);
    return null;
  }
};

/**
 * Fetches user's first and last name using their UID.
 * @param {string} uid - The user's UID.
 * @returns {Promise<string | null>} - The user's full name, null if not found.
 */
export const getFullName = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log(`Full name fetched: ${userData.firstName} ${userData.lastName}`);
      return `${userData.firstName} ${userData.lastName}`;
    } else {
      console.log("User does not exist.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user name:", error);
    return null;
  }
};

/**
 * Fetch all users and their most recent message with the logged-in user
 * @param {string} userId - The logged-in user's ID
 * @returns {Promise<Array>} - List of users with existing latest message
 */
export const getUsersWithMessages = async (userId) => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    const usersData = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const user = doc.data();
        const chatPartnerId = doc.id;
        
        // if (doc.id !== "mNLxDdtqyxlGeWesqnxW") return null;  //DEBUGGING

        if (userId === chatPartnerId) return null; //prevent fetching messages from own account

        //fetch the last message between the logged-in user and this user...
        const messagesCollection = collection(db, "messages");
        const q = query(
          messagesCollection,
          where("senderId", "in", [userId, chatPartnerId]),
          where("receiverId", "in", [userId, chatPartnerId]),
          orderBy("timestamp", "desc"),
          limit(1) //get only most recent message
        );

        const messagesSnapshot = await getDocs(q);
        const lastMessageData = messagesSnapshot.docs.length > 0 ? messagesSnapshot.docs[0].data() : null;

        if (lastMessageData) {//if last message exists, return chat + user info displayed in chat log
          return {
            id: chatPartnerId,
            firstName: user.firstName|| "firstName",
            lastName: user.lastName || "lastName",
            profilePicture: user.profilePicture || "https://robohash.org/default",
            lastMessage: lastMessageData ? lastMessageData.messageContent : "No messages yet",
            time: lastMessageData ? new Date(lastMessageData.timestamp.toDate()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true} ): "",
        };
      } else {
        return null; //no messages, skip user
      }
    })
  );
    const filteredUsersData = usersData.filter((user) => user !== null); //filter out users with no messages
    console.log("Fetched users with messages:", filteredUsersData);
    return filteredUsersData;
  } catch (error) {
    console.error("Error fetching users", error);
    return [];
  }
};

/**
 * Sends a message between users and stores it in Firestore.
 * @param {string} senderId - The sender's UID.
 * @param {string} receiverId - The receiver's UID.
 * @param {string} messageContent - The message content.
 */
export const sendMessage = async (senderId, receiverId, messageContent) => {
  try {
    await addDoc(collection(db, "messages"), {
      senderId,
      receiverId,
      messageContent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

/**
 * Retrieves direct messages between two users in real-time.
 * @param {string} currentUserId - The logged-in user's UID.
 * @param {string} chatPartnerId - The other user's UID.
 * @param {function} callback - Updates the state with new messages.
 * @returns {function} - Unsubscribe function for cleanup.
 */
export const getMessages = (currentUserId, chatPartnerId, callback) => {
  try {
    console.log(`Fetching messages between ${currentUserId} and ${chatPartnerId}...`);

    const messagesRef = collection(db, "messages");

    const q = query(
      messagesRef,
      where("senderId", "in", [currentUserId, chatPartnerId]), //query messages sent by either user
      where("receiverId", "in", [currentUserId, chatPartnerId]), //query messages received by either user
      orderBy("timestamp", "asc") //sort messages so most recent are on top
    );

    //Cleans up listener once component unmounts (exits SingleChatView screen)...
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => ({ //retrieve array of firestone docs from previous query
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Messages fetched:", messages);
      callback(messages);
    });

    return unsubscribe; // stop listening
  } catch (error) {
    console.error("Error setting up message listener:", error);
    return () => {};
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

/**
 * Fetches all user IDs from the "users" collection.
 * @returns {Promise<string[]>} - Array of user IDs.
 */
export const getAllUserIds = async () => {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);

    const userIds = querySnapshot.docs.map((doc) => doc.id); //query for uid
    console.log("Fetched user IDs:", userIds);
    return userIds;
  } catch (error) {
    console.error("Error fetching user IDs:", error);
    return [];
  }
};

/**
 * Fetches all users with their full names.
 * @returns {Promise<Array<{ id: string, fullName: string }>>} - Array of users with IDs and full names.
 */
export const getAlluidWithNames = async () => {
  try {
    const userIds = await getAllUserIds(); //fetch all uid
    const usersWithNames = [];

    for (const userId of userIds) {
      const fullName = await getFullName(userId); //fetch full name for each uid
      if (fullName) {
        usersWithNames.push({ id: userId, fullName }); //add user to list
      }
    }

    console.log("Fetched users with names:", usersWithNames);
    return usersWithNames;
  } catch (error) {
    console.error("Error fetching users with names:", error);
    return [];
  }
};

/**
 * Fetches all user IDs from the "users" collection.
 * @param {string} userId - Logged-in uid.
 * @param {string} friendId - Friend uid.
 * @returns {Promise<boolean>} - true if messages exist, otherwise false.
 */
export const hasMessagesWithFriend = async (userId, friendId) => {
  try {
    const messagesRef = collection(db, "messages");

    const q = query( //query to find messages between logged-in user and friend
      messagesRef,
      where("senderId", "in", [userId, friendId]),
      where("receiverId", "in", [userId, friendId])
    );

    const querySnapshot = await getDocs(q);

    //return true if there are messages, false otherwise...
    return querySnapshot.size > 0;
  } catch (error) {
    console.error("Error checking messages with friend:", error);
    return false;
  }
};

/*
 * SCHEDULER DB INTERACTIONS
 */
/**
 * Adds a new event to current users database and the shared database
 * @param {string} userId
 * @param {string} eventId
 * @param {string} title
 * @param {Timestamp} date
 * @param {string} description
 * @param {boolean} isadded
 * @param {string} createdBy 
 * @param {string} creatorName 
 */

export const AddEventToDatabase = async (
  userId,
  eventId,
  title,
  date,
  description,
  isadded,
  createdBy = null,
  creatorName = null,
) => {
  try {
    // Generate a unique ID if one is not provided
    const finalEventId = eventId || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Use the provided creator information or get it if needed
    const finalCreatorId = createdBy || userId
    let finalCreatorName = creatorName || "Unknown User"

    // Get name with creator id
    if (finalCreatorId && !finalCreatorName && finalCreatorId.length > 10 && !finalCreatorId.includes(" ")) {
      try {
        const name = await getFullName(finalCreatorId)
        if (name) {
          finalCreatorName = name
        }
      } catch (error) {
        console.error("Error fetching creator name:", error)
      }
    }

    // Only add to user's events collection if they created it
    if (finalCreatorId === userId) {
      const userEventRef = doc(db, "users", userId, "events", finalEventId)
      await setDoc(userEventRef, {
        title: title,
        date: date,
        description: description,
        isadded: isadded,
        createdBy: finalCreatorId,
        creatorName: finalCreatorName,
      })
    } 

    // Add to allEvents collection for global visibility
    const allEventsRef = doc(db, "users", userId, "allEvents", finalEventId)
    await setDoc(allEventsRef, {
      title: title,
      date: date,
      description: description,
      isadded: isadded,
      createdBy: finalCreatorId,
      creatorName: finalCreatorName,
    })
  } catch (error) {
    console.error("Error adding event to database:", error)
    throw error
  }
}

/**
 * Deletes an event from the current users database and shared database
 * @param {string} userId
 * @param {string} eventId
 */
export const DeleteEventFromDatabase = async (userId, eventId) => {
  try {
    // First, check if the event exists in the user's events collection
    const userEventRef = doc(db, "users", userId, "events", eventId)
    const eventDoc = await getDoc(userEventRef)

    // Delete from user's events collection
    await deleteDoc(userEventRef)

    // Delete from current user's allEvents collection
    const allEventsRef = doc(db, "users", userId, "allEvents", eventId)
    await deleteDoc(allEventsRef)

    // Sync deletion to all other users' allEvents collections
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const deletionPromises = []

    // Process each user to delete the event from their allEvents collection
    for (const userDoc of usersSnapshot.docs) {
      const otherUserId = userDoc.id

      // Skip the current user as we've already deleted from their collections
      if (otherUserId === userId) {
        continue
      }

      // Delete the event from this user's allEvents collection
      const otherUserAllEventsRef = doc(db, "users", otherUserId, "allEvents", eventId)
      deletionPromises.push(deleteDoc(otherUserAllEventsRef))
    }

    // Wait for all deletion operations to complete
    await Promise.all(deletionPromises)
  } catch (error) {
    console.error("Error deleting event from database:", error)
    throw error
  }
}

/**
 * Fetches events for current user
 * @param {string} userId
 * @param {function} setEvents
 */

// Get user
export const FetchEventsFromDatabase = (userId, setEvents) => {
  if (!userId) {
    return () => {}
  }
  // Get events
  const userEventsRef = collection(db, "users", userId, "events")
  return onSnapshot(
    userEventsRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const eventsList = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title,
            date: data.date,
            description: data.description,
            isadded: data.isadded,
            createdBy: data.createdBy || userId, 
          }
        })

        // Only include events created by this user
        const userEvents = eventsList.filter((event) => event.createdBy === userId || event.createdBy === "You")

        setEvents(userEvents)
      } else {
        setEvents([])
      }
    },
    (error) => {
      console.error("Error fetching events:", error)
    },
  )
}

/**
 * Fetches events for all users and stores them in the 'allEvents' collection under each user.
 * @param {string} userId
 * @param {function} setEvents
 */
export const SyncAllEventsFromDatabase = async (userId, callback) => {
  try {

    // Get all existing events from the user's own events collection
    const userEventsRef = collection(db, "users", userId, "events")
    const userEventsSnapshot = await getDocs(userEventsRef)

    // Create a map of existing event IDs to preserve them during sync
    const existingEventIds = new Map()
    userEventsSnapshot.docs.forEach((doc) => {
      existingEventIds.set(doc.id, true)
    })

    // Get all users
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const allEvents = []
    const batchOperations = []

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const creatorId = userDoc.id

      // Skip the current user - we already have their events from the listener
      if (creatorId === userId) {
        continue
      }

      // Get creator's name
      const creatorName = await getFullName(creatorId)

      // Get user's events
      const userEventsRef = collection(db, "users", creatorId, "events")
      const eventsSnapshot = await getDocs(userEventsRef)

      // Process each event
      for (const eventDoc of eventsSnapshot.docs) {
        const data = eventDoc.data()
        const eventId = eventDoc.id

        // Validate event data
        if (!data.title || !data.date || !data.description) {
          continue
        }

        // Create event object
        const event = {
          id: eventId,
          title: data.title,
          date: data.date,
          description: data.description,
          isadded: false, // Default to false for other users
          createdBy: data.createdBy || creatorId,
        }

        // Add to our collection array
        allEvents.push(event)

        // Store in allEvents collection 
        const allEventsRef = doc(db, "users", userId, "allEvents", eventId)
        batchOperations.push({
          ref: allEventsRef,
          data: {
            title: data.title,
            date: data.date,
            description: data.description,
            isadded: false,
            createdBy: data.createdBy || creatorId,
          },
        })
      }
    }

    // Now process all the batch operations in chunks
    const BATCH_SIZE = 500
    let operationCount = 0
    const batch = writeBatch(db)

    // Update or add each event to the current user's allEvents
    for (const event of allEvents) {
      // Check if this event already exists in the user's allEvents collection
      const allEventsRef = doc(db, "users", userId, "allEvents", event.id)
      const existingEventDoc = await getDoc(allEventsRef)

      // If the event exists, preserve its isadded status, otherwise default to false
      const isAdded = existingEventDoc.exists()
        ? existingEventDoc.data().isadded === true
        : event.createdBy === userId
          ? event.isadded
          : false

      batch.set(
        allEventsRef,
        {
          title: event.title,
          date: event.date,
          description: event.description,
          isadded: isAdded,
          createdBy: event.createdBy,
          creatorName: event.creatorName || null,
        },
        { merge: true },
      ) 

      operationCount++

      if (operationCount >= BATCH_SIZE) {
        await batch.commit()
        operationCount = 0
      }
    }

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit()
    }

    // Update state with all events
    if (callback) {
      callback(allEvents)
    }

    return allEvents
  } catch (error) {
    console.error("Error syncing all events:", error)
    if (callback) {
      callback([]) 
    }
    throw error
  }
}

/**
 * Removes specific events from allEvents collection
 * @param {string} userId
 * @param {string[]} eventIdsToRemove
 */
export const removeEventsFromAllEvents = async (userId, eventIdsToRemove) => {
  try {
    // If there are none, exit
    if (!eventIdsToRemove || eventIdsToRemove.length === 0) {
      return
    }

    const batch = writeBatch(db)
    let operationCount = 0
    const BATCH_SIZE = 500

    for (const eventId of eventIdsToRemove) {
      const eventRef = doc(db, "users", userId, "allEvents", eventId)
      batch.delete(eventRef)
      operationCount++

      if (operationCount >= BATCH_SIZE) {
        await batch.commit()
        operationCount = 0
      }
    }

    if (operationCount > 0) {
      await batch.commit()
    }
  } catch (error) {
    console.error("Error removing specific events:", error)
  }
}

// Gets the allEvents collection for current user
export const FetchAllEventsFromDatabase = (userId, setEvents) => {
  if (!userId) {
    console.error("Cannot fetch all events: No user ID provided")
    return () => {}
  }

  const allEventsRef = collection(db, "users", userId, "allEvents")

  return onSnapshot(
    allEventsRef,
    async (snapshot) => {
      const eventsList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          let creatorName = data.creatorName || data.createdBy || "Unknown User"

          if (
            !data.creatorName &&
            data.createdBy &&
            data.createdBy.length > 10 &&
            !data.createdBy.includes(" ") &&
            data.createdBy !== "Unknown User"
          ) {
            try {
              const name = await getFullName(data.createdBy)
              if (name) {
                creatorName = name
              }
            } catch (error) {
              console.error("Error fetching creator name:", error)
            }
          }

          return {
            id: doc.id,
            title: data.title,
            date: data.date,
            description: data.description,
            isadded: data.isadded === true, 
            createdBy: data.createdBy || "Unknown User",
            creatorName: creatorName,
          }
        }),
      )

      setEvents(eventsList) //update events
    },
    (error) => {
      console.error("Error fetching all events:", error)
    },
  )
}

/**
 * Force refresh all events
 * @param {string} userId
 * @param {function} setEvents
 */
export const ForceRefreshAllEvents = async (userId, setEvents) => {
  try {
    return await SyncAllEventsFromDatabase(userId, setEvents)
  } catch (error) {
    console.error("Error force refreshing events:", error)
  }
}

/**
 * Adds a new study session to the current user's database and all participants with personalized view.
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
  try {
    // Generate a unique ID if one is not provided
    const sessionId = studySessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get creator's name for friend's view
    const creatorName = await getFullName(userId)

    // Create a map of all participant names
    const participantNames = new Map()
    participantNames.set(userId, creatorName || "Creator")

    // Get names for all friends
    for (const friendId of studySessionFriends) {
      const friendName = await getFullName(friendId)
      participantNames.set(friendId, friendName || friendId)
    }

    // Create a title for the creator that includes all friends
    let creatorParticipantsList = ""
    if (studySessionFriends.length === 0) {
      creatorParticipantsList = "Solo Study Session"
    } else if (studySessionFriends.length === 1) {
      // Creator and one friend
      creatorParticipantsList = participantNames.get(studySessionFriends[0]) || "Friend"
    } else {
      // Creator and multiple friends
      const friendNames = studySessionFriends.map((id) => participantNames.get(id) || id)
      creatorParticipantsList = friendNames.slice(0, -1).join(", ") + " & " + friendNames[friendNames.length - 1]
    }

    const creatorPersonalizedTitle = `Study session with ${creatorParticipantsList}`

    // Add to creator's study sessions collection with personalized title
    const userStudySessionsRef = doc(db, "users", userId, "studySessions", sessionId)
    await setDoc(userStudySessionsRef, {
      title: creatorPersonalizedTitle,
      date: studySessionDate,
      friends: studySessionFriends,
      createdBy: userId,
      creatorName: creatorName || "Creator",
    })

    // Add to each friend's study sessions collection with personalized title
    for (const friendId of studySessionFriends) {
      // Create a title for this friend that includes other participants
      const otherParticipants = studySessionFriends
        .filter((id) => id !== friendId) // Exclude the current friend
        .map((id) => participantNames.get(id)) // Get names of other friends

      let participantsList = ""

      if (otherParticipants.length === 0) {
        participantsList = creatorName || "Creator"
      } else {
        const allParticipants = [creatorName || "Creator", ...otherParticipants]

        if (allParticipants.length === 1) {
          participantsList = allParticipants[0]
        } else {
          participantsList =
            allParticipants.slice(0, -1).join(", ") + " & " + allParticipants[allParticipants.length - 1]
        }
      }

      const personalizedTitle = `Study session with ${participantsList}`

      const friendStudySessionsRef = doc(db, "users", friendId, "studySessions", sessionId)
      await setDoc(friendStudySessionsRef, {
        title: personalizedTitle,
        date: studySessionDate,
        friends: studySessionFriends,
        createdBy: userId,
        creatorName: creatorName || "Creator",
      })
    }
    return sessionId
  } catch (error) {
    console.error("Error adding study session:", error)
    throw error
  }
}

/**
 * Deletes a study session from the Firestore database for the creator and all participants.
 * @param {string} userId
 * @param {string} studySessionId
 * @param {string[]} [participants]
 */
export const DeleteStudySessionFromDatabase = async (userId, studySessionId, participants = []) => {
  try {
    // Get the study session to find all participants if not provided
    if (participants.length === 0) {
      const sessionRef = doc(db, "users", userId, "studySessions", studySessionId)
      const sessionSnap = await getDoc(sessionRef)

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data()
        participants = sessionData.friends
      }
    }

    // Delete from creator's collection
    const userStudySessionsRef = doc(db, "users", userId, "studySessions", studySessionId)
    await deleteDoc(userStudySessionsRef)

    // Delete from each participant's collection
    for (const participantId of participants) {
      const participantSessionRef = doc(db, "users", participantId, "studySessions", studySessionId)
      await deleteDoc(participantSessionRef)
    }
  } catch (error) {
    console.error("Error deleting study session from database:", error)
    throw error
  }
}

/**
 * Fetches study sessions for the current user
 * @param {string} userId
 * @param {function} setSessions
 */
//Get user
export const FetchStudySessionsFromDatabase = (userId, setSessions) => {
  const userStudySessionsRef = collection(db, "users", userId, "studySessions")

  //Get study session
  return onSnapshot(userStudySessionsRef, (snapshot) => {
    const sessionsList = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        date: data.date,
        friends: data.friends,
        createdBy: data.createdBy,
        creatorName: data.creatorName || "Unknown User",
      }
    })
    setSessions(sessionsList)
  })
}
