// src/theme/emiTheme.ts
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const emiColors = {
  emiBlue: '#0052A5',   // fondo
  gold: '#E9B400',      // amarillo card alternativa
  white: '#FFFFFF',
  text: '#111827',
  outline: '#8A6D00',
};

export const emiTheme: MD3Theme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    background: emiColors.emiBlue, // ← fondo de pantalla
    onBackground: emiColors.white, // texto sobre azul (si quieres negro, pon text)

    surface: emiColors.white,      // ← Card por defecto: BLANCA
    onSurface: emiColors.text,

    primary: emiColors.gold,       // botones contained amarillos
    onPrimary: emiColors.text,

    outline: emiColors.outline,
  },
};
