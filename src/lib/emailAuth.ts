import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

WebBrowser.maybeCompleteAuthSession();

export function signUpEmail(email: string, password: string, displayName?: string) {
  return createUserWithEmailAndPassword(auth, email, password).then(async ({ user }) => {
    if (displayName) await updateProfile(user, { displayName });
    return user;
  });
}

export function signInEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  try {
    // Configura la request
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });

    // Si no está lista la request, retorna función vacía
    if (!request) {
      throw new Error("Google auth request not initialized");
    }

    // Abre el flujo de login
    const res = await promptAsync();

    if (res.type === "success") {
      const idToken = res.params.id_token;
      const credential = GoogleAuthProvider.credential(idToken);
      return await signInWithCredential(auth, credential);
    } else {
      throw new Error("Google sign-in canceled");
    }
  } catch (err) {
    console.error("Google Sign-in Error:", err);
    throw err;
  }
}