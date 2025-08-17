// lib/firestore.ts
import {
  collection, doc, addDoc, getDoc, getDocs,
  query, orderBy, limit as fsLimit, startAfter, onSnapshot,
  type DocumentSnapshot, type QueryDocumentSnapshot, type DocumentData,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Upload, Prediction, Plan } from "../types"
import { toDateSafe } from "@/lib/utils/firestoreDate"

// Create
export const createUpload = async (
  userId: string,
  uploadData: Omit<Upload, "id" | "createdAt">,
): Promise<string> => {
  const uploadsRef = collection(db, "users", userId, "uploads")
  const docRef = await addDoc(uploadsRef, {
    ...uploadData,
    createdAt: new Date(), // o serverTimestamp() si prefieres
  })
  return docRef.id
}

// Read single
export const getUpload = async (userId: string, uploadId: string): Promise<Upload | null> => {
  const ref = doc(db, "users", userId, "uploads", uploadId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as any
  return {
    id: snap.id,
    ...data,
    createdAt: toDateSafe(data.createdAt),
  } as Upload
}

// ⚡ getUserUploads con paginación real
export const getUserUploads = async (
  userId: string,
  pageSize = 10,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<{
  items: Upload[]
  nextCursor: QueryDocumentSnapshot<DocumentData> | null
}> => {
  const col = collection(db, "users", userId, "uploads")
  const base = query(col, orderBy("createdAt", "desc"), fsLimit(pageSize))

  const q = cursor
    ? query(col, orderBy("createdAt", "desc"), startAfter(cursor), fsLimit(pageSize))
    : base

  const snap = await getDocs(q)

  const items: Upload[] = snap.docs.map((d) => {
    const data = d.data() as any
    return {
      id: d.id,
      ...data,
      createdAt: toDateSafe(data.createdAt),
    } as Upload
  })

  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null
  return { items, nextCursor }
}

// Realtime
export const subscribeToUpload = (
  userId: string,
  uploadId: string,
  cb: (upload: Upload | null) => void,
) => {
  const ref = doc(db, "users", userId, "uploads", uploadId)
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null)
    const data = snap.data() as any
    cb({
      id: snap.id,
      ...data,
      createdAt: toDateSafe(data.createdAt),
    } as Upload)
  })
}

// predictions
export const getPrediction = async (predId: string): Promise<Prediction | null> => {
  const ref = doc(db, "predictions", predId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as any
  return { id: snap.id, ...data, createdAt: toDateSafe(data.createdAt) } as Prediction
}

// plans
export const getPlan = async (planId: string): Promise<Plan | null> => {
  const planRef = doc(db, "plans", planId)
  const snap = await getDoc(planRef)
  if (!snap.exists()) return null

  const raw = snap.data() as any
  // Si el backend guardó el plan anidado como raw.plan, lo usamos; si no, usamos raw directamente.
  const base = raw.plan ?? raw

  // Extraer objetivos diarios si vienen anidados en nutrition.targets_per_day
  const targets = base.nutrition?.targets_per_day ?? {}

  const plan: Plan = {
    id: snap.id,
    user_id: raw.userId || raw.user_id || base.user_id || "",
    pred_id: raw.predId || raw.pred_id || base.pred_id || "",
    kcal: targets.kcal ?? base.kcal ?? 0,
    protein_g: targets.protein_g ?? base.protein_g ?? 0,
    fat_g: targets.fat_g ?? base.fat_g ?? 0,
    carbs_g: targets.carbs_g ?? base.carbs_g ?? 0,
    runs_per_wk: base.runs_per_wk ?? 0,
    strength_per_wk: base.strength_per_wk ?? 0,
    training: Array.isArray(base.training) ? base.training : [], // 👈 default seguro
    meals_example: base.nutrition?.meals_example ?? base.meals_example ?? [],
    constraints: base.constraints,
    createdAt: toDateSafe(raw.createdAt),
  }

  return plan
}