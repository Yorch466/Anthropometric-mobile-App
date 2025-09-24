export const minSecToSeconds = (mm: number, ss: number) => mm * 60 + ss;

export const isPositive = (v: number) => Number.isFinite(v) && v > 0;

export function validateManualAnthropometry(m: {height_m: number; weight_kg: number}) {
  const err: string[] = [];
  if (!isPositive(m.height_m) || m.height_m < 1.2 || m.height_m > 2.3) err.push('Altura fuera de rango (1.20–2.30 m).');
  if (!isPositive(m.weight_kg) || m.weight_kg < 30 || m.weight_kg > 200) err.push('Peso fuera de rango (30–200 kg).');
  return err;
}

export function validateGoals(g: {goal_push: number; goal_sit: number; goal_3200_s: number}) {
  const err: string[] = [];
  if (!Number.isInteger(g.goal_push) || g.goal_push < 0) err.push('Flexiones inválidas.');
  if (!Number.isInteger(g.goal_sit) || g.goal_sit < 0) err.push('Abdominales inválidas.');
  if (!isPositive(g.goal_3200_s) || g.goal_3200_s > 3600) err.push('Tiempo 3200 inválido.');
  return err;
}
