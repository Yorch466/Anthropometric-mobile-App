"use client"
import { StatusBar } from "expo-status-bar"
import { PaperProvider, DefaultTheme } from "react-native-paper"
import AuthScreen from "@/screens/AuthScreen";
import { AppNavigator } from "./src/navigation/AppNavigator"
import { useAuth } from "./src/hooks/useAuth"
import { View, StyleSheet } from "react-native"
import { ActivityIndicator } from "react-native-paper"

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4a90e2",
    secondary: "#50c878",
    surface: "#ffffff",
    background: "#f5f5f5",
    onSurface: "#1a1a1a",
    onBackground: "#1a1a1a",
  },
}

export default function App() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
        <StatusBar style="auto" />
      </PaperProvider>
    )
  }

  return (
    <PaperProvider theme={theme}>
      {isAuthenticated ? <AppNavigator /> : <AuthScreen onAuthSuccess={() => {}} />}
      <StatusBar style="auto" />
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
})
