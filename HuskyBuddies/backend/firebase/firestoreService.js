import { db } from "./firebaseConfig";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
    
    console.log("User added to Firestore");
  } catch (error) {
    console.error("Error adding user to database:", error);
  }
};

export { addUserToDatabase };
