import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { DashboardScreen } from "../screens/DashboardScreen"
import { UploadScreen } from "../screens/UploadScreen"
import { ResultsScreen } from "../screens/ResultsScreen"
import { PlanDetailScreen } from "../screens/PlanDetailScreen"
import { HistoryScreen } from "../screens/HistoryScreen"
import PlanDetailPanel from "@/screens/PlanDetailPanel" // default import

export type RootStackParamList = {
  Dashboard: undefined
  Upload: undefined
  Results: { uploadId: string; predId: string; planId: string }
  PlanDetail: { planId: string }
  History: undefined
  PlanDetailPanel: { planId: string } // ✅ objeto, no string
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: { backgroundColor: "#4a90e2" },
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
      </Stack.Navigator>
    </NavigationContainer>
  )
}
