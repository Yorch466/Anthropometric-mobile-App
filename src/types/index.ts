export interface User {
  uid: string
  isAnonymous: boolean
}

export interface Goals {
  run_s: number // seconds for 3200m
  push: number // push-ups count
  sit: number // sit-ups count
}

export interface Constraints {
  vegan: boolean
  lactose_free: boolean
  gluten_free: boolean
  inj_knee: boolean
  inj_shoulder: boolean
  inj_back: boolean
}

export interface Upload {
  id: string
  image_path: string
  sex: number // 0=female, 1=male
  goals: Goals
  constraints: Constraints
  status: "pending" | "predicted" | "planned" | "error"
  predId?: string
  planId?: string
  createdAt: Date
}

export interface Prediction {
  id: string
  user_id: string
  upload_id: string
  height_m: number
  weight_kg: number
  class_idx: number
  class_name: string
  createdAt: Date
}

export interface Session {
  type: "run" | "strength" | "core"
  minutes?: number
  sets?: number
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
  createdAt: Date
}

export interface ProcessPayload {
  uploadId: string
  image_url: string
  sex: number
  goals: Goals
  constraints: Constraints
}
