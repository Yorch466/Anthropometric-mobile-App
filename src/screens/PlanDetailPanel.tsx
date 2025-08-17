// src/screens/PlanDetail.tsx
"use client"

import React from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Text, Card, ActivityIndicator, Chip, Divider } from "react-native-paper"
import { useRoute } from "@react-navigation/native"
import type { RouteProp } from "@react-navigation/native"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

type RootStackParamList = {
  PlanDetail: { planId: string }
}

type PlanDetailRoute = RouteProp<RootStackParamList, "PlanDetail">

type Session = {
  type: "run" | "strength" | "core"
  name?: string
  minutes?: number
  sets?: number
  pushups_sets?: number
  situps_sets?: number
  exercises?: string[]
}

type TrainingDay = {
  day: number | string
  sessions: Session[]
}

export default function PlanDetailPanel() {
  const route = useRoute<PlanDetailRoute>()
  const planId = route?.params?.planId

  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [plan, setPlan] = React.useState<any>(null)

  const fetchPlan = React.useCallback(async () => {
    if (!planId) {
      setError("Falta planId")
      setLoading(false)
      return
    }
    try {
      setError(null)
      const ref = doc(db, "plans", String(planId))
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error("No se encontró el plan.")
      setPlan(snap.data())
    } catch (e: any) {
      setError(e?.message ?? "Error cargando plan")
    } finally {
      setLoading(false)
    }
  }, [planId])

  React.useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPlan()
    setRefreshing(false)
  }

  const p = plan?.plan ?? {}
  const targets = p?.nutrition?.targets_per_day ?? {}
  const meals: any[] = Array.isArray(p?.nutrition?.meals_example) ? p.nutrition.meals_example : []
  const training: TrainingDay[] = Array.isArray(p?.training) ? p.training : []

  const dayLabel = (day: number | string) => {
    if (typeof day === "string") return day
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return days[day - 1] || `Día ${day}`
  }

  const sessionText = (s: Session): string => {
    if (!s) return "-"
    if (s.type === "run") return `Correr ${s.minutes ?? "-"} min${s.name ? ` · ${s.name}` : ""}`
    if (s.type === "strength") {
      const sets = s.sets ?? s.pushups_sets
      return `Fuerza ${sets ?? "-"} sets${s.exercises?.length ? ` · ${s.exercises.join(", ")}` : ""}`
    }
    if (s.type === "core") {
      const sets = s.situps_sets ?? s.minutes
      return `Core ${sets ?? "-"}`
    }
    return s.type
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Cargando plan...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>Error</Text>
        <Text style={{ color: "crimson", textAlign: "center" }}>{error}</Text>
        <Text style={{ marginTop: 8 }}>planId: {String(planId ?? "")}</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Nutrición */}
        <Card style={styles.card}>
          <Card.Title title="Objetivos de nutrición (por día)" />
          <Card.Content>
            <View style={styles.grid4}>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>Calorías</Text>
                <Text style={styles.boxValue}>{targets?.kcal ?? "-"}</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>Proteína</Text>
                <Text style={styles.boxValue}>{targets?.protein_g ?? "-"} g</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>Grasas</Text>
                <Text style={styles.boxValue}>{targets?.fat_g ?? "-"} g</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>Carbohidratos</Text>
                <Text style={styles.boxValue}>{targets?.carbs_g ?? "-"} g</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Comidas ejemplo */}
        <Card style={styles.card}>
          <Card.Title title="Comidas ejemplo" />
          <Card.Content>
            {meals.length === 0 ? (
              <Text>No hay comidas ejemplo.</Text>
            ) : (
              meals.map((m, i) => (
                <View key={i} style={styles.mealRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium">{m?.title ?? `Comida ${i + 1}`}</Text>
                    <Text style={{ color: "#666" }}>
                      {m?.kcal ?? "-"} kcal · P {m?.protein_g ?? "-"}g · G {m?.fat_g ?? "-"}g · C {m?.carbs_g ?? "-"}g
                    </Text>
                    <View style={styles.tagsRow}>
                      {(m?.tags ?? []).map((t: string, j: number) => (
                        <Chip key={j} style={styles.tagChip} textStyle={styles.tagText}>{t}</Chip>
                      ))}
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Entrenamiento completo */}
        <Card style={styles.card}>
          <Card.Title title="Entrenamiento semanal" />
          <Card.Content>
            {training.length === 0 ? (
              <Text>No hay sesiones de entrenamiento.</Text>
            ) : (
              training.map((d, i) => (
                <View key={`${String(d?.day ?? i)}-${i}`} style={styles.dayBlock}>
                  <Text variant="titleMedium" style={styles.dayTitle}>{dayLabel(d?.day ?? i + 1)}</Text>
                  <Divider style={{ marginVertical: 8 }} />
                  {(d?.sessions ?? []).length === 0 ? (
                    <Text style={{ color: "#666" }}>Descanso</Text>
                  ) : (
                    (d.sessions ?? []).map((s, j) => (
                      <Chip key={j} style={styles.sessionChip} textStyle={styles.sessionText}>
                        {sessionText(s)}
                      </Chip>
                    ))
                  )}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Metadata mínima */}
        <Card style={styles.card}>
          <Card.Title title="Metadatos" />
          <Card.Content>
            <Text>planId: {String(planId)}</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  card: { marginBottom: 16, borderRadius: 16 },
  grid4: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  box: { width: "48%", backgroundColor: "#f8f9fa", padding: 12, borderRadius: 12, marginBottom: 12 },
  boxTitle: { color: "#666", marginBottom: 4 },
  boxValue: { fontWeight: "bold", color: "#1a1a1a" },
  mealRow: { paddingVertical: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tagChip: { backgroundColor: "#E8F5E9" },
  tagText: { color: "#2E7D32" },
  dayBlock: { paddingVertical: 8 },
  dayTitle: { fontWeight: "600", color: "#1a1a1a" },
  sessionChip: { backgroundColor: "#e3f2fd", marginRight: 6, marginBottom: 6 },
  sessionText: { color: "#1976d2", fontSize: 12 },
})
