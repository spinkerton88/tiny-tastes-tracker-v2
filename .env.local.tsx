// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSBWBQgqSmez7VD7-mAFpctPtwjzxyfEw",
  authDomain: "tiny-tastes-tracker-ai.firebaseapp.com",
  projectId: "tiny-tastes-tracker-ai",
  storageBucket: "tiny-tastes-tracker-ai.firebasestorage.app",
  messagingSenderId: "217293220572",
  appId: "1:217293220572:web:ac900d8ca840feb1692219",
  measurementId: "G-ETWNDVRBT8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);