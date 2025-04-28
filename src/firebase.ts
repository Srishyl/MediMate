// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8V27KfEYGRLhyIJmIeAGGmGABPQHf2JI",
  authDomain: "hacksmith-5662e.firebaseapp.com",
  projectId: "hacksmith-5662e",
  storageBucket: "hacksmith-5662e.firebasestorage.app",
  messagingSenderId: "693182314570",
  appId: "1:693182314570:web:1f8fe97cec8a2c2edd0eb3",
  measurementId: "G-QS92VZ9827"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err: Error) => {
    if (err.name === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.name === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

// Log Firestore initialization
console.log('Firestore initialized with config:', {
  projectId: firebaseConfig.projectId
});

export default app;

// Add a document
const addData = async () => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      name: "John Doe",
      email: "john@example.com"
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// Get documents
const getData = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
  });
}; 