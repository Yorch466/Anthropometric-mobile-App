
// Antigua informacion mostrable en el perfil
// export interface User {
//   uid: string
//   isAnonymous: boolean
// }

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  age?: number | null;
  rankCategory?: string | null; // usa RankCategory si quieres tipado estricto
  rank?: string | null;         // usa RankOption['value']
  createdAt?: number;
  updatedAt?: number;
}


// src/types.ts
export type Goals = {
  run_s: number
  push: number
  sit: number
}

export type Constraints = {
  vegan: boolean
  lactose_free: boolean
  gluten_free: boolean
  inj_knee: boolean
  inj_shoulder: boolean
  inj_back: boolean
}

/**
 * Si usas React Navigation con Native Stack, define aquí tu RootStackParamList.
 * Ajusta nombres de pantallas y params a tu app real.
 */
export type RootStackParamList = {
  Dashboard: undefined
  Upload: undefined
  Results: { uploadId?: string; predId?: string; planId?: string; result?: any } | undefined
  PlanDetail: { planId: string }
  History: undefined
  PlanDetailPanel: { planId: string } // si de verdad lo usas
  AuthScreen: undefined
}



export interface Upload {
  id: string
  image_path: string
  sex: number // 0=female, 1=male
  goals: Goals
  constraints: Constraints
  status: "pending" | "predicted" | "planned" | "error" | "completed" 
  predId?: string
  planId?: string
  createdAt: any // Timestamp de Firestore
}

export interface Prediction {
  id: string
  user_id: string
  upload_id: string
  height_m: number
  weight_kg: number
  class_idx: number
  class_name: string
  createdAt: any // Timestamp de Firestore
}

export interface Session {
  type: "run" | "strength" | "core"
  minutes?: number
  sets?: number
  exercises?: string[]
  pushups_sets?: number
  situps_sets?: number
}

export interface TrainingDay {
  day: number // 1-7
  sessions: Session[]
}

export interface MealExample {
  title: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  tags: string[]
}

export interface Plan {
  id: string
  user_id: string
  pred_id: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  runs_per_wk: number
  strength_per_wk: number
  training: TrainingDay[]
  meals_example: MealExample[]
  constraints?: Constraints
  createdAt: any
}

export interface ProcessPayload {
  uploadId: string
  image_url: string
  sex: number
  goals: Goals
  constraints: Constraints
}

export type Sex = 'M' | 'F';

export type InputMode = 'image' | 'manual';

export interface ManualAnthropometry {
  height_m: number;
  weight_kg: number;
}

export interface GoalsManual {
  goal_push: number;     // flexiones en 2min
  goal_sit: number;      // abdominales en 2min
  goal_3200_s: number;   // tiempo objetivo en segundos
}

export interface GoalsAutoRequest {
  sex: Sex;
  ageYears: number;
  targetScore: number;   // 60..100
}

export interface GoalsAutoResponse extends GoalsManual {}

export interface ProcessRequestJSON {
  input_mode: 'manual';
  sex: 0 | 1;                 // 0=female, 1=male
  manual: ManualAnthropometry;
  goals: GoalsManual;
  user_id: string;
  knee?: number; shoulder?: number; back?: number;
  vegan?: number; lactose_free?: number; gluten_free?: number;
}

export interface ProcessResponse {
  height_m: number;
  weight_kg: number;
  bmi: number;
  class_idx: number;
  class_name: 'desnutricion' | 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';
  class_source: 'cnn' | 'bmi';
  plan: any;
  plan_json_path?: string;
  result_json_path?: string;
  uploadId: string;
  predId: string;
  planId: string;
}




