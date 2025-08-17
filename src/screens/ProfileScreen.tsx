// src/screens/ProfileScreen.tsx
import React from "react"
import { View, StyleSheet } from "react-native"
import { Text } from "react-native-paper"
import BottomActionBar from "@/components/BottomActivationBar"
import { emiTheme } from "@/theme/emitheme"
import { useTheme } from "react-native-paper"
import type { AppTheme } from "@/theme/emitheme"
import type { RootStackParamList } from "@/navigation/AppNavigator"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"


type Nav = NativeStackNavigationProp<RootStackParamList, "Dashboard">
const theme = useTheme<AppTheme>()

export default function ProfileScreen() {
  return (
    <View style={styles.root}>
      <View style={{ padding: 16 }}>
        <Text variant="headlineSmall" style={{ color: emiTheme.colors.primary, fontWeight: "700" }}>
          Perfil
        </Text>
        <Text style={{ marginTop: 8, color: theme.custom.muted }}>Pronto podrás editar tus datos aquí.</Text>
      </View>
      <BottomActionBar />
    </View>
  )
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: emiTheme.colors.background, justifyContent: "space-between" } })
