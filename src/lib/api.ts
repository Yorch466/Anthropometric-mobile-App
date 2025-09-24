import { auth } from '@/lib/firebase';
import { PROCESS_URL, PROCESS_PATH, PROCESS_JSON_PATH, GOALS_AUTO_PATH } from '@/config/env';
import { GoalsAutoRequest, GoalsAutoResponse, ProcessRequestJSON, ProcessResponse } from '../types';

export type CallProcessParams = {
  fileUri: string;
  sex: number;
  goal_3200_s: number;
  goal_push: number;
  goal_sit: number;
  user_id: string;
  knee?: number;
  shoulder?: number;
  back?: number;
  vegan?: number;
  lactose_free?: number;
  gluten_free?: number;
  baseUrl?: string;                 // override puntual
  processPath?: string;             // override puntual (/process ó /api/process)
  fileFieldName?: 'file' | 'image'; // backend actual: 'file'
  filename?: string;
  mime?: string;
};

export interface ApiErrorShape {
  status: number;
  body?: any;
  url: string;
  method: string;
}

/** ===== Utils ===== */
const normalizeBaseUrl = (u?: string) => (u ?? PROCESS_URL ?? '').replace(/\/+$/, '');

function withTimeout<T>(p: Promise<T>, ms = 60000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

async function getIdToken(): Promise<string | null> {
  try {
    const u = auth.currentUser;
    return u ? await u.getIdToken() : null;
  } catch {
    return null;
  }
}

async function handleResponse(res: Response, url: string, method: string) {
  if (!res.ok) {
    let body: any;
    try { body = await res.json(); } catch { try { body = await res.text(); } catch { /* ignore */ } }
    const err: ApiErrorShape = { status: res.status, body, url, method };
    throw err;
  }
  try {
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

/** ====== IMAGEN → /process (multipart/form-data) ====== */
export async function callProcessMultipart(params: CallProcessParams) {
  const base = normalizeBaseUrl(params.baseUrl);
  if (!base) throw new Error('PROCESS_URL no configurado');

  const processPath = params.processPath ?? PROCESS_PATH ?? '/process';
  const url = `${base}${processPath}`;

  const form = new FormData();
  const filePart: any = {
    uri: params.fileUri,
    name: params.filename ?? 'upload.jpg',
    type: params.mime ?? 'image/jpeg',
  };
  const fieldName = params.fileFieldName ?? 'file'; // ← tu backend usa 'file'
  form.append(fieldName, filePart);

  form.append('sex', String(params.sex));
  form.append('goal_3200_s', String(params.goal_3200_s));
  form.append('goal_push', String(params.goal_push));
  form.append('goal_sit', String(params.goal_sit));
  form.append('user_id', params.user_id);

  if (params.knee != null)         form.append('knee', String(params.knee));
  if (params.shoulder != null)     form.append('shoulder', String(params.shoulder));
  if (params.back != null)         form.append('back', String(params.back));
  if (params.vegan != null)        form.append('vegan', String(params.vegan));
  if (params.lactose_free != null) form.append('lactose_free', String(params.lactose_free));
  if (params.gluten_free != null)  form.append('gluten_free', String(params.gluten_free));

  const token = await getIdToken();

  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  }), 60000);

  return await handleResponse(res, url, 'POST');
}

/** ====== MANUAL → /process/json (application/json) ====== */
export async function callProcessManualJSON(body: ProcessRequestJSON, baseUrl?: string, pathOverride?: string) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) throw new Error('PROCESS_URL no configurado');

  const path = pathOverride ?? PROCESS_JSON_PATH ?? '/process/json';
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const token = await getIdToken();

  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }), 60000);

  return await handleResponse(res, url, 'POST') as ProcessResponse;
}

/** ====== Metas automáticas (Anexo A) → /goals/auto ====== */
export async function fetchAutoGoals(req: GoalsAutoRequest, baseUrl?: string, pathOverride?: string) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) throw new Error('PROCESS_URL no configurado');

  const path = pathOverride ?? GOALS_AUTO_PATH ?? '/goals/auto';
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const token = await getIdToken();

  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
  }), 15000);

  return await handleResponse(res, url, 'POST') as GoalsAutoResponse;
}

/** ===== ping ===== */
export async function ping(baseUrl?: string, path: string = '/health') {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) throw new Error('PROCESS_URL no configurado');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await withTimeout(fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  }), 8000);

  return res.ok;
}
