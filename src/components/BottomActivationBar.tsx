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
import { Linking } from "react-native"


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

    // Mantener índice: where(status == planned) + orderBy(updatedAt desc)
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

      const uploadId = String(d.id)
      const predId   = String(v?.predId ?? "")
      const planId   = String(v?.planId ?? "")

      if (predId && planId) {
        // Igual que HistoryScreen: ir directo a Results con los 3 IDs
        nav.navigate("Results", { uploadId, predId, planId } as any)
      } else {
        // Si falta algo, manda al Historial para elegir uno válido
        Alert.alert("Rutina incompleta", "No se encontró predId/planId. Revisa tu historial.")
        nav.navigate("History")
      }
      return
    }

    // Si no hay ningún “planned”, guía al usuario
    Alert.alert("Aún no tienes rutinas", "Genera tu primera rutina subiendo una foto o con entrada manual.")
    nav.navigate("Upload")
  } catch (e: any) {
    // Cuando falta el índice compuesto, Firestore devuelve un error con un link '...indexes?create_composite=...'
    const msg = String(e?.message ?? "")
    const link = msg.match(/https:\/\/[^\s]+indexes[^\s"]+/)?.[0] // intenta extraer el enlace de creación

    if (link) {
      Alert.alert(
        "Índice requerido",
        "Para usar esta búsqueda, crea el índice compuesto en Firestore.",
        [
          { text: "Abrir enlace", onPress: () => Linking.openURL(link) },
          { text: "OK" },
        ]
      )
    } else {
      console.warn("Rutinas:", e)
      Alert.alert("Ups", "No se pudo obtener tu última rutina. Abre el Historial.")
    }

    nav.navigate("History")
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
