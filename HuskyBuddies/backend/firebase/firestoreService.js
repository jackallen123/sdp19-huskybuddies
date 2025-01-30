import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const testFirestoreConnection = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "testCollection"));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
    });
    console.log("Firestore connection successful.");
  } catch (error) {
    console.error("Error connecting to Firestore:", error);
  }
};
