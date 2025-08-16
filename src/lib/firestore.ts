import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  type DocumentSnapshot,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Upload, Prediction, Plan } from "../types"

// Upload operations
export const createUpload = async (userId: string, uploadData: Omit<Upload, "id" | "createdAt">): Promise<string> => {
  const uploadsRef = collection(db, "users", userId, "uploads")
  const docRef = await addDoc(uploadsRef, {
    ...uploadData,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const getUpload = async (userId: string, uploadId: string): Promise<Upload | null> => {
  const uploadRef = doc(db, "users", userId, "uploads", uploadId)
  const uploadSnap = await getDoc(uploadRef)

  if (uploadSnap.exists()) {
    return {
      id: uploadSnap.id,
      ...uploadSnap.data(),
      createdAt: uploadSnap.data().createdAt.toDate(),
    } as Upload
  }

  return null
}

export const getUserUploads = async (
  userId: string,
  limitCount = 10,
  lastDoc?: DocumentSnapshot,
): Promise<Upload[]> => {
  const uploadsRef = collection(db, "users", userId, "uploads")
  let q = query(uploadsRef, orderBy("createdAt", "desc"), limit(limitCount))

  if (lastDoc) {
    q = query(uploadsRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount))
  }

  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Upload[]
}

// Real-time upload status listener
export const subscribeToUpload = (userId: string, uploadId: string, callback: (upload: Upload | null) => void) => {
  const uploadRef = doc(db, "users", userId, "uploads", uploadId)

  return onSnapshot(uploadRef, (doc) => {
    if (doc.exists()) {
      const upload = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as Upload
      callback(upload)
    } else {
      callback(null)
    }
  })
}

// Prediction operations
export const getPrediction = async (predId: string): Promise<Prediction | null> => {
  const predRef = doc(db, "predictions", predId)
  const predSnap = await getDoc(predRef)

  if (predSnap.exists()) {
    return {
      id: predSnap.id,
      ...predSnap.data(),
      createdAt: predSnap.data().createdAt.toDate(),
    } as Prediction
  }

  return null
}

// Plan operations
export const getPlan = async (planId: string): Promise<Plan | null> => {
  const planRef = doc(db, "plans", planId)
  const planSnap = await getDoc(planRef)

  if (planSnap.exists()) {
    return {
      id: planSnap.id,
      ...planSnap.data(),
      createdAt: planSnap.data().createdAt.toDate(),
    } as Plan
  }

  return null
}
