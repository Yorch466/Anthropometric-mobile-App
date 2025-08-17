import { doc, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Upload } from "@/types"

/** Convierte Firestore Timestamp a Date */
function tsToDate(v: any): Date | any {
  return v instanceof Timestamp ? v.toDate() : v
}

/** Normaliza los datos al tipo Upload */
function mapUpload(id: string, data: any): Upload {
  return {
    id,
    image_path: data.image_path ?? "",
    sex: data.sex ?? 0,
    goals: data.goals ?? { run_s: 0, push: 0, sit: 0 },
    constraints: data.constraints ?? {
      vegan: false,
      lactose_free: false,
      gluten_free: false,
      inj_knee: false,
      inj_shoulder: false,
      inj_back: false,
    },
    status: data.status ?? "pending",
    predId: data.predId,
    planId: data.planId,
    createdAt: tsToDate(data.createdAt) ?? new Date(),
  }
}

/**
 * Suscribe en tiempo real a un upload: users/{userId}/uploads/{uploadId}
 */
export function subscribeToUpload(
  userId: string,
  uploadId: string,
  cb: (upload: Upload | null) => void
) {
  const ref = doc(db, "users", userId, "uploads", uploadId)

  const unsubscribe = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        cb(null)
        return
      }
      cb(mapUpload(snap.id, snap.data()))
    },
    (err) => {
      console.error("subscribeToUpload error:", err)
      cb(null)
    }
  )

  return unsubscribe
}
