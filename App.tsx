// App.tsx
"use client"

import React, { useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import { StatusBar } from "expo-status-bar"
import { PaperProvider, ActivityIndicator } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { emiTheme } from "@/theme/emitheme" // tu tema (sin 'muted' en colors de MD3)
import { AppNavigator } from "@/navigation/AppNavigator"
import AuthScreen from "@/screens/AuthScreen"

import { subscribeAuth } from "@/hooks/auth"      // 🔸 viene de TU auth.ts
import { upsertUserProfile } from "@/lib/userProfile"

export default function App() {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Nos suscribimos a Firebase Auth
    const unsub = subscribeAuth(async (user) => {
      setIsAuthenticated(!!user)
      setLoading(false)
      if (user) {
        try {
          // Por si acaso (ya lo haces en login/signup, pero no estorba)
          await upsertUserProfile(user)
        } catch {}
      }
    })
    return unsub
  }, [])

  if (loading) {
    return (
      <PaperProvider theme={emiTheme}>
        <SafeAreaProvider>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </PaperProvider>
    )
  }

  return (
    <PaperProvider theme={emiTheme}>
      <SafeAreaProvider>
        {isAuthenticated ? <AppNavigator /> : <AuthScreen />}
        <StatusBar style={isAuthenticated ? "light" : "dark"} />
      </SafeAreaProvider>
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
