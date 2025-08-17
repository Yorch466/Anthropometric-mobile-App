// src/theme/emiTheme.ts
import { MD3LightTheme, type MD3Theme } from "react-native-paper"

export const palette = {
  primary: "#0B4F2B",
  primaryDark: "#07351D",
  secondary: "#C6A431",
  secondaryDark: "#967F22",
  accent: "#C62828",
  bg: "#F4F6F4",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  outline: "#E2E8F0",
}

// tipo de tema extendido con un campo `custom`
export type AppTheme = MD3Theme & {
  custom: typeof palette
}

export const emiTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    primaryContainer: palette.primaryDark,
    secondary: palette.secondary,
    secondaryContainer: palette.secondaryDark,
    error: palette.accent,
    background: palette.bg,
    surface: palette.surface,
    surfaceVariant: "#EFF3EF",
    outline: palette.outline,
    onPrimary: "#FFFFFF",
    onSecondary: "#1A1A1A",
    onSurface: palette.text,
    onBackground: palette.text,
  },
  roundness: 14,
  custom: palette, // 👈 tus extras van aquí
}
