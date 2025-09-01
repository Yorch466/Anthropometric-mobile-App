// src/navigation/RootNavigator.tsx
import React, { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActivityIndicator, View } from "react-native"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { upsertUserProfile } from "@/lib/userProfile"

// Screens
import AuthScreen from "@/screens/AuthScreen"            // tu AuthScreen anterior (o EMIAuthScreen si prefieres)
import { DashboardScreen } from "@/screens/DashboardScreen"
import { UploadScreen } from "@/screens/UploadScreen"
import { ResultsScreen } from "@/screens/ResultsScreen"
import { PlanDetailScreen } from "@/screens/PlanDetailScreen"
import { HistoryScreen } from "@/screens/HistoryScreen"
import PlanDetailPanel from "@/screens/PlanDetailPanel"
// Si tienes ProfileScreen:
import ProfileScreen from "@/screens/ProfileScreen" // si no existe, crea un stub

export type RootStackParamList = {
  // App
  Dashboard: undefined
  Upload: undefined
  Results: { uploadId: string; predId: string; planId: string }
  PlanDetail: { planId: string }
  History: undefined
  PlanDetailPanel: { planId: string }
  Profile: undefined

  // Auth
  Auth: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // asegura doc users/{uid}
        await upsertUserProfile(u)
      }
      setInitializing(false)
    })
    return unsub
  }, [])

  if (initializing) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user ? (
        // ======= App stack (logueado) =======
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: { backgroundColor: "#0052a5" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "600" },
          }}
        >
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Inicio" }} />
          <Stack.Screen name="Upload" component={UploadScreen} options={{ title: "Subir Foto" }} />
          <Stack.Screen name="Results" component={ResultsScreen} options={{ title: "Resultados" }} />
          <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: "Plan Detallado" }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: "Historial" }} />
          <Stack.Screen name="PlanDetailPanel" component={PlanDetailPanel} options={{ title: "Plan (detalle)" }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
        </Stack.Navigator>
      ) : (
        // ======= Auth stack (no logueado) =======
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
