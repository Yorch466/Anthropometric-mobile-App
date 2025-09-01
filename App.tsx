// App.tsx
"use client"
import React from "react"
import { StatusBar } from "expo-status-bar"
import { PaperProvider, MD3LightTheme } from "react-native-paper"
import RootNavigator from "@/navigation/AppNavigator"

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0052a5",     // Azul EMI
    secondary: "#e9b400",   // Amarillo EMI
    background: "#f5f7fb",
    surface: "#ffffff",
  },
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <StatusBar style="light" />
    </PaperProvider>
  )
}
