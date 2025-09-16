// src/lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/userProfile';

// Mapea errores de Firebase a mensajes claros (ES)
export function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Correo inválido.';
    case 'auth/missing-password': return 'Ingresa tu contraseña.';
    case 'auth/weak-password': return 'La contraseña es muy corta (mínimo 6 caracteres).';
    case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password': return 'Credenciales incorrectas.';
    case 'auth/user-disabled': return 'Esta cuenta está deshabilitada.';
    case 'auth/network-request-failed': return 'Sin conexión. Revisa tu internet.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde.';
    case 'auth/operation-not-allowed': return 'Operación no permitida en este proyecto.';
    default: return 'Ocurrió un error. Inténtalo de nuevo.';
  }
}

// Helper para extraer code de un error desconocido
function getFirebaseCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as any).code === 'string') {
    return (err as any).code as string;
  }
  return '';
}

// ============ Helpers principales ============

// REGISTRO
export async function handleSignup(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const normEmail = email.trim().toLowerCase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, normEmail, password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    // No bloquees el login si falla la escritura en Firestore
    upsertUserProfile(cred.user).catch((e) => {
      console.warn('[upsertUserProfile@signup] ', e);
    });
    return cred;
  } catch (e: unknown) {
    const code = getFirebaseCode(e);
    const msg = friendlyAuthError(code);
    const err = new Error(msg);
    (err as any).code = code; // preserva el código por si la UI lo necesita
    throw err;
  }
}

// LOGIN
export async function handleLogin(email: string, password: string): Promise<UserCredential> {
  const normEmail = email.trim().toLowerCase();
  try {
    const cred = await signInWithEmailAndPassword(auth, normEmail, password);
    upsertUserProfile(cred.user).catch((e) => {
      console.warn('[upsertUserProfile@login] ', e);
    });
    return cred;
  } catch (e: unknown) {
    const code = getFirebaseCode(e);
    const msg = friendlyAuthError(code);
    const err = new Error(msg);
    (err as any).code = code;
    throw err;
  }
}

// LOGOUT
export async function handleLogout(): Promise<void> {
  await signOut(auth);
}

// UID actual
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

// Suscripción a cambios de sesión (para App.tsx o un provider)
export function subscribeAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}
