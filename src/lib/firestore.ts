// lib/firestore.ts
import {
  collection, doc, addDoc, getDoc, getDocs,
  query, orderBy, limit as fsLimit, startAfter, onSnapshot, Timestamp,
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
  const createdAt: Date =
    raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(raw.createdAt ?? Date.now())

  // ⚠️ Si viene anidado en raw.plan, lo “aplanamos”
  const embedded = raw.plan
  if (embedded) {
    const tp = embedded?.nutrition?.targets_per_day ?? {}
    const training = Array.isArray(embedded?.training) ? embedded.training : []

    const normalized: Plan = {
      id: snap.id,
      user_id: raw.userId ?? raw.user_id ?? "",
      pred_id: raw.predId ?? raw.pred_id ?? "",
      // ← valores que tus pantallas esperan “planos”:
      kcal: tp.kcal ?? 0,
      protein_g: tp.protein_g ?? 0,
      fat_g: tp.fat_g ?? 0,
      carbs_g: tp.carbs_g ?? 0,
      // Si tu planner no devuelve estos a nivel nutrition, puedes guardarlos en `summary`
      runs_per_wk: embedded.runs_per_wk ?? embedded.summary?.runs_per_wk ?? 0,
      strength_per_wk: embedded.strength_per_wk ?? embedded.summary?.strength_per_wk ?? 0,
      training,                           // ← lista de días/sesiones
      meals_example: embedded.nutrition?.meals_example ?? [],
      constraints: embedded.constraints ?? undefined,
      createdAt,
    }
    return normalized
  }

  // Si ya viniera “plano”, lo respetamos
  return {
    id: snap.id,
    user_id: raw.user_id ?? raw.userId ?? "",
    pred_id: raw.pred_id ?? raw.predId ?? "",
    kcal: raw.kcal ?? 0,
    protein_g: raw.protein_g ?? 0,
    fat_g: raw.fat_g ?? 0,
    carbs_g: raw.carbs_g ?? 0,
    runs_per_wk: raw.runs_per_wk ?? 0,
    strength_per_wk: raw.strength_per_wk ?? 0,
    training: raw.training ?? [],
    meals_example: raw.meals_example ?? [],
    constraints: raw.constraints ?? undefined,
    createdAt,
  } as Plan
}