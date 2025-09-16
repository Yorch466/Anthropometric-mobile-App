// src/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBVBzX784D0z0GdhgFgcchr8KzG8h53dLo',
  authDomain: 'antrophometric-medition.firebaseapp.com',
  projectId: 'antrophometric-medition',
  storageBucket: 'antrophometric-medition.appspot.com', // 👈 corregido
  messagingSenderId: '688496742424',
  appId: '1:688496742424:web:d64321b88118926d10336d',
  measurementId: 'G-9YTXS0PZPW'
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Mantener una sola instancia de Auth incluso con Fast Refresh
declare global {
  // eslint-disable-next-line no-var
  var _authInstance: Auth | undefined;
}

if (!global._authInstance) {
  // Evita que TS moleste por typings del helper en RN
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth');
  global._authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = global._authInstance!;
export const db = getFirestore(app);
export const storage = getStorage(app);
