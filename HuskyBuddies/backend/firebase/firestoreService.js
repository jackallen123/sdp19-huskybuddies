import { db } from "./firebaseConfig";
import { getFirestore, doc, setDoc, deleteDoc } from "firebase/firestore";

/**
 * Adds a new user to the Firestore database.
 * @param {string} uid - The user's unique identifier.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} email - The user's email.
 */
const addUserToDatabase = async (uid, firstName, lastName, email) => {
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
const deleteUserFromDatabase = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user from database:", error);
  }
};

export { addUserToDatabase, deleteUserFromDatabase };

//EVENTS PAGE
/**
 Adds a new event to the Firestore database.
 @param {number} Eventid 
 @param {string} Eventtitle
 @param {string} Eventdate 
 @param {string} Eventlocation 
 @param {string} Eventdescription
 @param {boolean} Eventoncalendar
 */

 const AddEventToDatabase = async (Eventid, Eventtitle, Eventdate , Eventlocation, Eventdescription, Eventoncalendar) => {
  try {
    const userRef = doc(db, "Events", Eventid);
    await setDoc(userRef, {
      Eventtitle,
      Eventdate,
      Eventlocation,
      Eventdescription,
      Eventoncalendar
    });

  } catch (error) {
    console.error("Error adding event to database:", error);
  }
};

/**
 Deletes an event from the Firestore database.
 @param {string} Eventid
 */
const DeleteEventFromDatabase = async (Eventid) => {
  try {
    const userRef = doc(db, "Events", Eventid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting event from database:", error);
  }
};

/**
 Adds a new study session to the Firestore database.
 @param {number} Studysessionid
 @param {string} Studysessiontitle 
 @param {string} Studysessiondate 
 @param {string[]} StudySessionfriends //need to pull from users matching page
 */

const AddStudySessionToDatabase = async (Studysessionid, Studysessiontitle, Studysessiondate, StudySessionfriends) => {
  try {
    const userRef = doc(db, "StudySessions", Studysessionid);
    await setDoc(userRef, {
      Studysessiontitle,
      Studysessiondate,
      StudySessionfriends 
    });

  } catch (error) {
    console.error("Error adding study session to database:", error);
  }

};
/**
 * Deletes a study session from the Firestore database.
 * @param {string} Studysessionid
 */
const DeleteStudySessionFromDatabase = async (Studysessionid) => {
  try {
    const userRef = doc(db, "StudySessions", Studysessionid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting study session from database:", error);
  }
};
export {AddEventToDatabase, DeleteEventFromDatabase, AddStudySessionToDatabase, DeleteStudySessionFromDatabase};