// src/lib/api.ts
import { auth } from '@/lib/firebase'
import { PROCESS_URL } from '@/config/env'

/** ========== Tipos ========== */
export type CallProcessParams = {
  fileUri: string
  sex: number
  goal_3200_s: number
  goal_push: number
  goal_sit: number
  user_id: string
  knee?: number
  shoulder?: number
  back?: number
  vegan?: number
  lactose_free?: number
  gluten_free?: number
  /** Opcional: sobreescribe PROCESS_URL si quieres apuntar a otro host temporalmente */
  baseUrl?: string
  /** Opcional: nombre del campo para el archivo si tu backend espera 'image' en lugar de 'file' */
  fileFieldName?: 'file' | 'image'
  /** Opcional */
  filename?: string
  mime?: string
}

export interface ApiErrorShape {
  status: number
  body?: any
  url: string
  method: string
}

/** ========== Utils ========== */
const normalizeBaseUrl = (u?: string) => (u ?? PROCESS_URL ?? '').replace(/\/+$/, '')

function withTimeout<T>(p: Promise<T>, ms = 60000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    p.then(v => { clearTimeout(t); resolve(v) })
     .catch(e => { clearTimeout(t); reject(e) })
  })
}

async function getIdToken(): Promise<string | null> {
  try {
    const u = auth.currentUser
    return u ? await u.getIdToken() : null
  } catch {
    return null
  }
}

async function handleResponse(res: Response, url: string, method: string) {
  if (!res.ok) {
    let body: any = undefined
    try { body = await res.json() } catch { try { body = await res.text() } catch { /* no-op */ } }
    const err: ApiErrorShape = { status: res.status, body, url, method }
    throw err
  }
  try {
    const txt = await res.text()
    return txt ? JSON.parse(txt) : null
  } catch { return null }
}

/** ========== API ========== */
export async function callProcessMultipart(params: CallProcessParams) {
  const base = normalizeBaseUrl(params.baseUrl)
  if (!base) throw new Error('PROCESS_URL no configurado (EXPO_PUBLIC_PROCESS_URL)')

  const url = `${base}/process`

  const form = new FormData()
  const filePart: any = {
    uri: params.fileUri,
    name: params.filename ?? 'upload.jpg',
    type: params.mime ?? 'image/jpeg',
  }
  const fieldName = params.fileFieldName ?? 'file' // ← mantengo 'file' como en tu código
  form.append(fieldName, filePart)

  form.append('sex', String(params.sex))
  form.append('goal_3200_s', String(params.goal_3200_s))
  form.append('goal_push', String(params.goal_push))
  form.append('goal_sit', String(params.goal_sit))
  form.append('user_id', params.user_id)

  if (params.knee != null)         form.append('knee', String(params.knee))
  if (params.shoulder != null)     form.append('shoulder', String(params.shoulder))
  if (params.back != null)         form.append('back', String(params.back))
  if (params.vegan != null)        form.append('vegan', String(params.vegan))
  if (params.lactose_free != null) form.append('lactose_free', String(params.lactose_free))
  if (params.gluten_free != null)  form.append('gluten_free', String(params.gluten_free))

  const token = await getIdToken()

  const res = await withTimeout(fetch(url, {
    method: 'POST',
    // No pongas Content-Type manual (FormData/React Native define boundary)
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  }))

  return await handleResponse(res, url, 'POST')
}

/** Healthcheck rápido */
export async function ping(baseUrl?: string) {
  const base = normalizeBaseUrl(baseUrl)
  if (!base) throw new Error('PROCESS_URL no configurado (EXPO_PUBLIC_PROCESS_URL)')
  const url = `${base}/health`

  const res = await withTimeout(fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  }), 8000)

  return res.ok
}
