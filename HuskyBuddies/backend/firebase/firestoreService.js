import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

/**
 * Adds a new user to the Firestore database.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
export const addUserToDatabase = async (firstName, lastName, email, password) => {
    try {
      const userCollectionRef = collection(db, 'users');
      const docRef = await addDoc(userCollectionRef, {
        firstName,
        lastName,
        email,
        password,
      });
      console.log('User added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding user to database:', error);
    }
  };
