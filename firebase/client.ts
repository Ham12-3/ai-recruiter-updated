// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJ-fQ71tfL2tIILUzW1IFzrQiMRg6HIww",
  authDomain: "prepwise-7570c.firebaseapp.com",
  projectId: "prepwise-7570c",
  storageBucket: "prepwise-7570c.firebasestorage.app",
  messagingSenderId: "400230990373",
  appId: "1:400230990373:web:c0b0aeefefbe14737c75cc",
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const db = getFirestore(app);
