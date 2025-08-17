// src/components/BottomActionBar.tsx
import React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Text } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { emiTheme } from "@/theme/emitheme"

type Item = { icon: string; label: string; onPress: () => void }

export default function BottomActionBar() {
  const nav = useNavigation<any>()
  const items: Item[] = [
    { icon: "dumbbell", label: "Rutinas", onPress: () => nav.navigate("PlanDetail") },
    { icon: "history", label: "Historial", onPress: () => nav.navigate("History") },
    { icon: "home", label: "Inicio", onPress: () => nav.navigate("Dashboard") },
    { icon: "camera-plus", label: "Subir", onPress: () => nav.navigate("Upload") },
    { icon: "account", label: "Perfil", onPress: () => nav.navigate("Profile") }, // crea un stub Profile si no existe
  ]
  return (
    <View style={styles.bar}>
      {items.map((it) => (
        <TouchableOpacity key={it.label} onPress={it.onPress} style={styles.btn} activeOpacity={0.75}>
          <MaterialCommunityIcons name={it.icon as any} size={22} color="#fff" />
          <Text variant="labelSmall" style={styles.label}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: emiTheme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: "space-between",
  },
  btn: { alignItems: "center", flex: 1, gap: 2 },
  label: { color: "#fff", opacity: 0.9 },
})
