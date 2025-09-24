import React from "react"
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native"
import { Text } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { emiColors } from "@/theme/emitheme"
import { SafeAreaView } from "react-native-safe-area-context"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentUserId } from "@/hooks/auth"

type Item = { icon: string; label: string; onPress: () => void }

export default function BottomActionBar() {
  const nav = useNavigation<any>()

  const handleGoRutinas = async () => {
    try {
      const uid = getCurrentUserId()
      if (!uid) {
        Alert.alert("Sesión", "Inicia sesión para ver tus rutinas.")
        nav.navigate("Auth")
        return
      }
      const q = query(
        collection(db, "users", uid, "uploads"),
        where("status", "==", "planned"),
        orderBy("updatedAt", "desc"),
        limit(1)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        const d = snap.docs[0]
        const v: any = d.data()
        nav.navigate("Results", {
          uploadId: String(d.id),
          predId: String(v?.predId ?? ""),
          planId: String(v?.planId ?? ""),
        })
      } else {
        // si no hay ningún plan, te mando a Subir (puedes cambiar por History si prefieres)
        Alert.alert("Aún no tienes rutinas", "Genera tu primera rutina subiendo una foto o con entrada manual.")
        nav.navigate("Upload")
      }
    } catch (e) {
      console.warn("Rutinas:", e)
      nav.navigate("Upload")
    }
  }

  const items: Item[] = [
    { icon: "dumbbell", label: "Rutinas", onPress: handleGoRutinas },
    { icon: "history", label: "Historial", onPress: () => nav.navigate("History") },
    { icon: "home", label: "Inicio", onPress: () => nav.navigate("Dashboard") },
    { icon: "camera-plus", label: "Subir", onPress: () => nav.navigate("Upload") },
    { icon: "account", label: "Perfil", onPress: () => nav.navigate("Profile") },
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: "space-between",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 12 },
    }),
  },
  btn: { alignItems: "center", flex: 1, gap: 4 },
  label: { color: "#fff", opacity: 0.95, fontSize: 12 },
})
