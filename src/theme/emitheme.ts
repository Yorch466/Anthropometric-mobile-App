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

export const emiColors = {
  emiBlue: "#0052a5",
  gold: "#e9b400",        // dorado
  goldBright: "#e9b500",  // brillante
  white: "#FFFFFF",
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#6b7280",
  surfaceVariant: "#EFF4FF",
}

export const emiTheme = {
  colors: {
    primary: emiColors.emiBlue,
    secondary: emiColors.gold,
    secondaryBright: emiColors.goldBright,
    background: emiColors.bg,
    surface: emiColors.surface,
    onSurface: emiColors.text,
    surfaceVariant: emiColors.surfaceVariant,
  },
}


