// src/components/BottomActionBar.tsx
import React from "react"
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native"
import { Text } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { emiTheme, emiColors } from "@/theme/emitheme"
import { SafeAreaView } from "react-native-safe-area-context"

type Item = { icon: string; label: string; onPress: () => void }

export default function BottomActionBar() {
  const nav = useNavigation<any>()
  const items: Item[] = [
    // OJO: PlanDetail requiere planId; si no lo tienes aquí, mejor manda a History
    { icon: "dumbbell", label: "Rutinas", onPress: () => nav.navigate("History") },
    { icon: "history", label: "Historial", onPress: () => nav.navigate("History") },
    { icon: "home", label: "Inicio", onPress: () => nav.navigate("Dashboard") },
    { icon: "camera-plus", label: "Subir", onPress: () => nav.navigate("Upload") },
    { icon: "account", label: "Perfil", onPress: () => nav.navigate("Profile") }, // asegúrate de tener esta ruta
  ]
  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <View style={styles.bar}>
        {items.map((it) => (
          <TouchableOpacity key={it.label} onPress={it.onPress} style={styles.btn} activeOpacity={0.8}>
            <MaterialCommunityIcons name={it.icon as any} size={26} color={emiColors.gold} />
            <Text variant="labelSmall" style={styles.label}>{it.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { position: "absolute", bottom: 0, left: 0, right: 0 },
  bar: {
    flexDirection: "row",
    backgroundColor: emiColors.emiBlue,
    paddingVertical: 14,           // ⇧ más alto
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: "space-between",
    // sombra
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 12 },
    }),
  },
  btn: { alignItems: "center", flex: 1, gap: 4 },
  label: { color: "#fff", opacity: 0.95, fontSize: 12 },
})
