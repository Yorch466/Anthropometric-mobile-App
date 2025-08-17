// src/lib/api.ts
import type { ProcessPayload } from "../types"
import { PROCESS_URL } from "@/config/env"
import { getAuth } from "firebase/auth"

function withTimeout<T>(p: Promise<T>, ms = 20000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Tiempo de espera agotado (${ms}ms)`)), ms)
    p.then(v => { clearTimeout(t); resolve(v) }).catch(e => { clearTimeout(t); reject(e) })
  })
}

// export const callProcess = async (payload: ProcessPayload): Promise<any> => {
//   try {
//     const response = await fetch(`${PROCESS_URL.replace(/\/$/, "")}/process`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     })

//     if (!response.ok) {
//       const text = await response.text().catch(() => "")
//       throw new Error(`Process API failed: ${response.status} ${text}`)
//     }

//     // intenta parsear respuesta; si el backend no devuelve json, retorna null
//     try {
//       return await response.json()
//     } catch {
//       return null
//     }
//   } catch (error) {
//     console.error("Process API call failed:", error)
//     throw error
//   }
// }

export async function callProcessMultipart(params: {
  fileUri: string
  sex: number
  goal_3200_s: number
  goal_push: number
  goal_sit: number
  user_id: string
  knee?: number; shoulder?: number; back?: number
  vegan?: number; lactose_free?: number; gluten_free?: number
  baseUrl: string
}) {
  const form = new FormData()

  form.append("file", {
    uri: params.fileUri,
    name: "upload.jpg",
    type: "image/jpeg",
  } as any)

  form.append("sex", String(params.sex))
  form.append("goal_3200_s", String(params.goal_3200_s))
  form.append("goal_push", String(params.goal_push))
  form.append("goal_sit", String(params.goal_sit))
  form.append("user_id", params.user_id)

  if (params.knee != null) form.append("knee", String(params.knee))
  if (params.shoulder != null) form.append("shoulder", String(params.shoulder))
  if (params.back != null) form.append("back", String(params.back))
  if (params.vegan != null) form.append("vegan", String(params.vegan))
  if (params.lactose_free != null) form.append("lactose_free", String(params.lactose_free))
  if (params.gluten_free != null) form.append("gluten_free", String(params.gluten_free))

  const res = await fetch(`${PROCESS_URL.replace(/\/$/, "")}/process`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Process API failed: ${res.status} ${txt}`)
  }
  try { return await res.json() } catch { return null }
}

// (Opcional) Healthcheck rápido
export const ping = async () => {
  const res = await fetch(`${PROCESS_URL.replace(/\/$/, "")}/health`)
  return res.ok
}
