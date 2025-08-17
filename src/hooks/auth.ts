// src/lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
  UserCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { upsertUserProfile } from "@/lib/userProfile"

// 👇 Úsalo para mostrar errores amigables
export function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email": return "Correo inválido."
    case "auth/missing-password": return "Ingresa tu contraseña."
    case "auth/weak-password": return "La contraseña es muy corta (mínimo 6 caracteres)."
    case "auth/email-already-in-use": return "Este correo ya está registrado."
    case "auth/user-not-found": return "No existe una cuenta con ese correo."
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Credenciales incorrectas."
    case "auth/too-many-requests": return "Demasiados intentos. Intenta más tarde."
    default: return "Ocurrió un error. Inténtalo de nuevo."
  }
}

// ============ Helpers principales ============

// REGISTRO
export async function handleSignup(email: string, password: string, displayName?: string): Promise<UserCredential> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() })
    }
    await upsertUserProfile(cred.user) // crea/actualiza users/{uid}
    return cred
  } catch (e: any) {
    const msg = friendlyAuthError(e?.code || "")
    // re-lanzamos con mensaje amigable
    throw new Error(msg)
  }
}

// LOGIN
export async function handleLogin(email: string, password: string): Promise<UserCredential> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    await upsertUserProfile(cred.user) // actualiza lastLoginAt
    return cred
  } catch (e: any) {
    const msg = friendlyAuthError(e?.code || "")
    throw new Error(msg)
  }
}

// LOGOUT
export async function handleLogout(): Promise<void> {
  await signOut(auth)
}

// UID actual
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null
}

// Suscripción a cambios de sesión (para App.tsx o un provider)
export function subscribeAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb)
}
