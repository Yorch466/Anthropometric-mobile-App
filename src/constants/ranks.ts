// src/constants/ranks.ts
export type RankCategory =
  | 'sargentos'
  | 'suboficiales'
  | 'oficiales_subalternos'
  | 'oficiales_superiores'
  | 'oficiales_generales';

export interface RankOption { value: string; label: string }

export const RANKS: Record<RankCategory, { label: string; options: RankOption[] }> = {
  sargentos: {
    label: 'Sargentos',
    options: [
      { value: 'sargento_inicial', label: 'Sargento Inicial' },
      { value: 'sargento_primero', label: 'Sargento Primero' },
      { value: 'sargento_segundo', label: 'Sargento Segundo' },
    ],
  },
  suboficiales: {
    label: 'Suboficiales',
    options: [
      { value: 'suboficial_inicial', label: 'Suboficial Inicial' },
      { value: 'suboficial_segundo', label: 'Suboficial Segundo' },
      { value: 'suboficial_primero', label: 'Suboficial Primero' },
      { value: 'suboficial_mayor', label: 'Suboficial Mayor' },
      { value: 'suboficial_maestre', label: 'Suboficial Maestre' },
    ],
  },
  oficiales_subalternos: {
    label: 'Oficiales subalternos',
    options: [
      { value: 'subteniente', label: 'Subteniente' },
      { value: 'teniente', label: 'Teniente' },
      { value: 'capitan', label: 'Capitán' },
    ],
  },
  oficiales_superiores: {
    label: 'Oficiales superiores',
    options: [
      { value: 'mayor', label: 'Mayor' },
      { value: 'teniente_coronel', label: 'Teniente Coronel' },
      { value: 'coronel', label: 'Coronel' },
    ],
  },
  oficiales_generales: {
    label: 'Oficiales generales',
    options: [
      { value: 'gral_brigada', label: 'Gral. de Brigada' },
      { value: 'gral_division', label: 'Gral. de División' },
      { value: 'gral_fuerza', label: 'Gral. de Fuerza' },
    ],
  },
};
