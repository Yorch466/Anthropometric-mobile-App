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

export const callProcess = async (payload: ProcessPayload): Promise<any> => {
  try {
    const response = await fetch(`${PROCESS_URL.replace(/\/$/, "")}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`Process API failed: ${response.status} ${text}`)
    }

    // intenta parsear respuesta; si el backend no devuelve json, retorna null
    try {
      return await response.json()
    } catch {
      return null
    }
  } catch (error) {
    console.error("Process API call failed:", error)
    throw error
  }
}

// (Opcional) Healthcheck rápido
export const ping = async () => {
  const res = await fetch(`${PROCESS_URL.replace(/\/$/, "")}/health`)
  return res.ok
}
