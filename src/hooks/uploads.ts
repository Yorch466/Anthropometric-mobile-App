// src/lib/uploads.ts
import { doc, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Upload } from "@/types"

const ts = (v: any) => (v instanceof Timestamp ? v.toDate() : v)

const mapUpload = (id: string, d: any): Upload => ({
  id,
  image_path: d.image_path ?? "",
  sex: d.sex ?? 0,
  goals: d.goals ?? { run_s: 0, push: 0, sit: 0 },
  constraints: d.constraints ?? {
    vegan: false, lactose_free: false, gluten_free: false,
    inj_knee: false, inj_shoulder: false, inj_back: false,
  },
  status: d.status ?? "pending",
  predId: d.predId,
  planId: d.planId,
  createdAt: ts(d.createdAt) ?? new Date(),
})

export function subscribeToUpload(
  userId: string,
  uploadId: string,
  cb: (u: Upload | null) => void
) {
  const ref = doc(db, "users", userId, "uploads", uploadId)
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? mapUpload(snap.id, snap.data()) : null),
    (err) => { console.error("subscribeToUpload error:", err); cb(null) }
  )
}
