import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase" // asegúrate de exportar db en tu firebase.ts
import type { User as AppUser } from "../types"

/**
 * Crea o actualiza el documento users/{uid}.
 * - Si no existe: crea con createdAt y lastLoginAt
 * - Si existe: solo actualiza lastLoginAt y campos que cambien (merge)
 */
export async function upsertUserProfile(firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; isAnonymous?: boolean }) {
  const uid = firebaseUser.uid
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)

  const base = {
    displayName: firebaseUser.displayName ?? "",
    email: firebaseUser.email ?? "",
    photoURL: firebaseUser.photoURL ?? "",
    isAnonymous: !!firebaseUser.isAnonymous,
    lastLoginAt: serverTimestamp(),
  }

  if (!snap.exists()) {
    // crear nuevo
    await setDoc(ref, {
      ...base,
      createdAt: serverTimestamp(),
      // opcionales iniciales:
      sex: null,          // 0/1 si luego lo defines
      birthYear: null,
      flags: {},          // {inj_knee:false, vegan:false, ...}
    })
  } else {
    // merge para no pisar otros campos
    await setDoc(ref, base, { merge: true })
  }
  return ref.id
}
