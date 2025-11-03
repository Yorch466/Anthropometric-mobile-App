// src/lib/plan-ui.ts
export type MealsTotals = { kcal: number; protein_g: number; fat_g: number; carbs_g: number };
export type Extra = { title: string; kcal: number; protein_g: number; fat_g?: number; carbs_g?: number; tags?: string[] };

export type Session = {
  type?: string;
  name?: string;
  minutes?: number;
  duration_min?: number;
  distance_km?: number;
  sets?: number;
  reps?: number;
  pushups_sets?: number;
  situps_sets?: number;
  exercises?: string[];
};

export type TrainingDay = { day: number | string; sessions: Session[] };
export type Meal = { title?: string; category?: string; kcal?: number; protein_g?: number; fat_g?: number; carbs_g?: number; tags?: string[] };

export type PlanUI = {
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  runs_per_wk: number;
  strength_per_wk: number;
  training: TrainingDay[];
  meals_example: Meal[];      // ← lista plana lista para pintar
  extras: Extra[];
  meals_totals: MealsTotals | null;
};

// Aplana cualquier forma de "meals" que venga del backend:
//  - objeto por categoría: { breakfast:{...}, lunch:{...} }
//  - arrays dentro de categorías: { breakfast:[{...},{...}] }
//  - forma alternativa: { breakfast:{ items:[{...}] } }
function flattenMeals(input: any): Meal[] {
  if (!input) return [];
  // Si ya es una comida válida
  if (typeof input === "object" && !Array.isArray(input)) {
    const looksLikeMeal = ["title","kcal","protein_g","fat_g","carbs_g"].some(k => k in input);
    if (looksLikeMeal) return [input as Meal];

    // Si viene como { items: [...] }
    if (Array.isArray((input as any).items)) {
      return ((input as any).items as any[]).flatMap(flattenMeals);
    }

    // Es un objeto "carpeta": recorrer valores
    return Object.values(input).flatMap(flattenMeals);
  }
  // Si es array
  if (Array.isArray(input)) {
    return (input as any[]).flatMap(flattenMeals);
  }
  return [];
}

export function normalizePlan(raw: any): PlanUI {
  const p = raw?.plan ? raw.plan : raw ?? {};

  // TRAINING
  const training: TrainingDay[] = Array.isArray(p.training)
    ? p.training.map((d: any, idx: number) => ({
        day: d?.day ?? idx + 1,
        sessions: Array.isArray(d?.sessions) ? d.sessions : [],
      }))
    : [];

  const totals = training.reduce<{ runs: number; str: number }>((acc, d) => {
    (d.sessions || []).forEach((s: Session) => {
      const t = (s?.type || "").toLowerCase();
      if (t === "run") acc.runs += 1;
      if (t === "strength") acc.str += 1;
    });
    return acc;
  }, { runs: 0, str: 0 });

  // NUTRICIÓN (según backend)
  const n = p?.nutrition ?? {};
  const targets = n?.targets_per_day ?? null;

  // Orden de prioridad:
  // 1) meals_example (array)
  // 2) nutrition.meals (obj/array/anidado)
  // 3) p.meals (fallback si alguien lo guardó a nivel raíz)
  let meals_example: Meal[] = [];
  if (Array.isArray(n?.meals_example)) {
    meals_example = flattenMeals(n.meals_example);
  } else if (n?.meals) {
    meals_example = flattenMeals(n.meals);
  } else if (p?.meals) {
    meals_example = flattenMeals(p.meals);
  }

  const extras: Extra[] = Array.isArray(n?.extras) ? n.extras : [];
  const meals_totals: MealsTotals | null = n?.meals_totals ?? n?.meal_totals ?? null;

  return {
    kcal: targets?.kcal ?? null,
    protein_g: targets?.protein_g ?? null,
    fat_g: targets?.fat_g ?? null,
    carbs_g: targets?.carbs_g ?? null,
    runs_per_wk: p?.runs_per_wk ?? totals.runs,
    strength_per_wk: p?.strength_per_wk ?? totals.str,
    training,
    meals_example,
    extras,
    meals_totals,
  };
}
