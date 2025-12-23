import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  // Your config object from Project Settings
  apiKey: "AIzaSyC_xeE4wQXpGvlYJwBVbbyXH1AH7x8baJc",
  authDomain: "tiny-tastes-tracker-ai.firebaseapp.com",
  projectId: "tiny-tastes-tracker-ai",
  storageBucket: "tiny-tastes-tracker-ai.firebasestorage.app",
  messagingSenderId: "87950543929",
  appId: "1:87950543929:web:2e63d2392fd65b596411e8",
  measurementId: "G-4WGBFJBMGL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 1. Google Login
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Google Login failed", error);
    throw error;
  }
};

// 2. Email Registration
export const registerWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Registration failed", error);
    throw error;
  }
};

// 3. Email Login
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

// 4. Logout
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// 5. Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.uid);
    // Start syncing data for this specific user
    syncUserData(user.uid);
  } else {
    console.log("User is signed out");
  }
});

// 6. Function to listen to the user's specific document
function syncUserData(userId: string) {
  const userDocRef = doc(db, "users", userId);
  onSnapshot(userDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      console.log("Real-time data received:", docSnapshot.data());
    } else {
      console.log("No data found for this user yet.");
    }
  });
}

// 7. Function to update data
export async function updateStatus(userId: string, newStatus: string) {
  const userDocRef = doc(db, "users", userId);
  await setDoc(userDocRef, { status: newStatus, lastUpdated: new Date() }, { merge: true });
}