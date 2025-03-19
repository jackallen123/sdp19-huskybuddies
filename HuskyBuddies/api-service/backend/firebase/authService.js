import { auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { addUserToDatabase, deleteUserFromDatabase } from "./firestoreService";

const signUp = async (email, password, firstName, lastName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // store the user data into firestore
        await addUserToDatabase(user.uid, firstName, lastName, email);
        return user;
    } catch (error) {
        console.error("Error signing up:", error.message);
        throw error;
    }
};

const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in:", error.message);
        throw error;
    }
};

const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error.message);
        throw error;
    }
};

const deleteUserAccount = async (user) => {
    try {
        await deleteUserFromDatabase(user.uid);

        await deleteUser(user);
    } catch (error) {
        console.error("Error deleting account:", error.message);
        throw error;
    }
};

export { signUp, signIn, signOutUser, deleteUserAccount };