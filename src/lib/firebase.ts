import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBVBzX784D0z0GdhgFgcchr8KzG8h53dLo",
  authDomain: "antrophometric-medition.firebaseapp.com",
  projectId: "antrophometric-medition",
  storageBucket: "antrophometric-medition.firebasestorage.app",
  messagingSenderId: "688496742424",
  appId: "1:688496742424:web:d64321b88118926d10336d",
  measurementId: "G-9YTXS0PZPW"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = initializeAuth(app); // 👈 sin persistencia
export const db = getFirestore(app);
export const storage = getStorage(app);
export { GoogleAuthProvider, signInWithCredential }
;
