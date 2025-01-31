import { auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { addUserToDatabase } from "./firestoreService";

const signUp = async (email, password, firstName, lastName) => {
    try {
        const userCredential = createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // store the user data into firestore
        await addUserToDatabase(user.uid, firstName, lastName, email);
        console.log("User registered", user);
        return user;
    } catch (error) {
        console.error("Error signing up:", error.message);
        throw error;
    }
};

const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in:", userCredential.user)
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in:", error.message);
        throw error;
    }
}

export { signUp, signIn };