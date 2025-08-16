import { initializeApp } from "firebase/app"
import { getAuth, signInAnonymously, type Auth, type User } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVBzX784D0z0GdhgFgcchr8KzG8h53dLo",
  authDomain: "antrophometric-medition.firebaseapp.com",
  projectId: "antrophometric-medition",
  storageBucket: "antrophometric-medition.firebasestorage.app",
  messagingSenderId: "688496742424",
  appId: "1:688496742424:web:d64321b88118926d10336d",
  measurementId: "G-9YTXS0PZPW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)

// Ensure anonymous sign-in
export const ensureAnonSignIn = async (): Promise<User> => {
  const currentUser = auth.currentUser

  if (currentUser) {
    return currentUser
  }

  try {
    const result = await signInAnonymously(auth)
    return result.user
  } catch (error) {
    console.error("Anonymous sign-in failed:", error)
    throw error
  }
}

// Helper to get current user ID
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null
}

export { subscribeToUpload } from "./firestore"
