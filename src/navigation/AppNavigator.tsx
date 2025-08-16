import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

// Import screens (we'll create these in next tasks)
import { DashboardScreen } from "../screens/DashboardScreen"
import { UploadScreen } from "../screens/UploadScreen"
import { ResultsScreen } from "../screens/ResultsScreen"
import { PlanDetailScreen } from "../screens/PlanDetailScreen"
import { HistoryScreen } from "../screens/HistoryScreen"

export type RootStackParamList = {
  Dashboard: undefined
  Upload: undefined
  Results: {
    uploadId: string
    predId: string
    planId: string
  }
  PlanDetail: {
    planId: string
  }
  History: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#4a90e2",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Inicio" }} />
        <Stack.Screen name="Upload" component={UploadScreen} options={{ title: "Subir Foto" }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: "Resultados" }} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: "Plan Detallado" }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: "Historial" }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
