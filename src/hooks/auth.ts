// src/lib/auth.ts
import { getAuth } from 'firebase/auth'

export function getCurrentUserId(): string | null {
  return getAuth().currentUser?.uid ?? null
}
