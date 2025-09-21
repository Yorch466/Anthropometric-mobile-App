// src/lib/userProfile.ts
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';

export async function upsertUserProfile(user: User, extra?: Partial<UserProfile>) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  const base: Partial<UserProfile> = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    updatedAt: Date.now(),
  };
  if (!snap.exists()) {
    base.createdAt = Date.now();
  }
  await setDoc(ref, { ...base, ...(extra ?? {}) }, { merge: true });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...data, updatedAt: Date.now() });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
