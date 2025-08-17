// src/screens/ResultsScreen.tsx
"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, Button, ActivityIndicator, Chip } from "react-native-paper"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Si tienes tu RootStackParamList tipado, usa ese tipo:
type RootStackParamList = {
  Results: { uploadId: string; predId: string; planId: string }
  PlanDetail: { planId: string }
}

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, "Results">
type ResultsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Results">
type ResultsRoute = RouteProp<RootStackParamList, "Results">

type Prediction = {
  id?: string
  height_m: number
  weight_kg: number
  class_idx: number
  class_name: string
}

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

type NormalizedPlan = {
  kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  runs_per_wk: number
  strength_per_wk: number
  training: TrainingDay[]
}

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<ResultsNavigationProp>()
  const route = useRoute<ResultsRoute>()
  const uploadId = route?.params?.uploadId
  const predId = route?.params?.predId
  const planId = route?.params?.planId

  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [plan, setPlan] = useState<NormalizedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uploadId || !predId || !planId) {
      setError("Faltan parámetros para mostrar resultados.")
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // predictions/{predId} (colección raíz)
        const predRef = doc(db, "predictions", String(predId))
        const predSnap = await getDoc(predRef)
        if (!predSnap.exists()) throw new Error("No se encontró la predicción.")
        const predData = predSnap.data() as any

        const pred: Prediction = {
          id: predSnap.id,
          height_m: Number(predData.height_m ?? 0),
          weight_kg: Number(predData.weight_kg ?? 0),
          class_idx: Number(predData.class_idx ?? 0),
          class_name: String(predData.class_name ?? "-"),
        }
        setPrediction(pred)

        // plans/{planId} (colección raíz). Backend guarda dentro de campo "plan"
        const planRef = doc(db, "plans", String(planId))
        const planSnap = await getDoc(planRef)
        if (!planSnap.exists()) throw new Error("No se encontró el plan.")
        const raw = planSnap.data() as any

        // extrae nutrition/training desde raw.plan
        const p = raw?.plan ?? {}
        const nutrition = p?.nutrition ?? {}
        const targets = nutrition?.targets_per_day ?? {}
        const trainingRaw: any[] = Array.isArray(p?.training) ? p.training : []

        // normaliza training a { day, sessions }
        const training: TrainingDay[] = trainingRaw.map((d: any, idx: number) => ({
          day: d?.day ?? idx + 1,
          sessions: Array.isArray(d?.sessions) ? d.sessions : [],
        }))

        // calcula runs_per_wk / strength_per_wk contando sesiones por tipo
        const totals = training.reduce(
          (acc, d) => {
            (d.sessions || []).forEach((s: Session) => {
              if (s?.type === "run") acc.runs += 1
              if (s?.type === "strength") acc.str += 1
            })
            return acc
          },
          { runs: 0, str: 0 }
        )

        const normalized: NormalizedPlan = {
          kcal: targets?.kcal ?? null,
          protein_g: targets?.protein_g ?? null,
          fat_g: targets?.fat_g ?? null,
          carbs_g: targets?.carbs_g ?? null,
          runs_per_wk: totals.runs,
          strength_per_wk: totals.str,
          training,
        }

        setPlan(normalized)
      } catch (e: any) {
        console.error("Error loading results:", e)
        setError(e?.message ?? "Error al cargar resultados.")
      } finally {
        setLoading(false)
      }
    })()
  }, [uploadId, predId, planId])

  const handleViewFullPlan = () => {
    if (!planId) return
    navigation.navigate("PlanDetail", { planId: String(planId) })
  }

  const dayLabel = (day: number | string) => {
    if (typeof day === "string") return day
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return days[day - 1] || `Día ${day}`
  }

  const sessionText = (s: Session): string => {
    if (!s) return "-"
    if (s.type === "run") {
      return `Correr ${s.minutes ?? "-"} min${s.name ? ` · ${s.name}` : ""}`
    }
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

  // ---------- UI STATES ----------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando resultados...</Text>
      </View>
    )
  }

  if (error || !prediction || !plan) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall" style={styles.errorTitle}>Error al cargar datos</Text>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error ?? "No se pudieron cargar los resultados"}
        </Text>
        <Text style={{ marginTop: 8 }}>
          uploadId: {String(uploadId ?? "")}
          {"\n"}predId: {String(predId ?? "")}
          {"\n"}planId: {String(planId ?? "")}
        </Text>
      </View>
    )
  }

  const trainingToShow = Array.isArray(plan.training) ? plan.training.slice(0, 3) : []

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Medidas */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>Medidas Corporales</Text>
            <View style={styles.measurementsGrid}>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>
                  {prediction.height_m.toFixed(2)} m
                </Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>Altura</Text>
              </View>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>
                  {prediction.weight_kg.toFixed(1)} kg
                </Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>Peso</Text>
              </View>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>
                  {prediction.class_name}
                </Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>Clasificación</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Nutrición */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>Nutrición Diaria</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>{plan.kcal ?? "-"}</Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>Calorías</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>{plan.protein_g ?? "-"}g</Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>Proteína</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>{plan.fat_g ?? "-"}g</Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>Grasas</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>{plan.carbs_g ?? "-"}g</Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>Carbohidratos</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Semanal */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>Plan Semanal</Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>Resumen de tu entrenamiento semanal</Text>

            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text variant="titleLarge" style={styles.weeklyStatValue}>{plan.runs_per_wk}</Text>
                <Text variant="bodyMedium" style={styles.weeklyStatLabel}>Carreras/semana</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text variant="titleLarge" style={styles.weeklyStatValue}>{plan.strength_per_wk}</Text>
                <Text variant="bodyMedium" style={styles.weeklyStatLabel}>Fuerza/semana</Text>
              </View>
            </View>

            <View style={styles.trainingPreview}>
              {trainingToShow.length > 0 ? (
                trainingToShow.map((day, idx) => (
                  <View key={`${String(day.day)}-${idx}`} style={styles.dayPreview}>
                    <Text variant="titleMedium" style={styles.dayName}>{dayLabel(day.day)}</Text>
                    <View style={styles.sessionsPreview}>
                      {(day.sessions ?? []).map((s, j) => (
                        <Chip key={j} style={styles.sessionChip} textStyle={styles.sessionChipText}>
                          {sessionText(s)}
                        </Chip>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <Text>No hay sesiones para mostrar.</Text>
              )}

              {Array.isArray(plan.training) && plan.training.length > 3 && (
                <Text variant="bodyMedium" style={styles.moreText}>
                  +{plan.training.length - 3} días más
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => handleViewFullPlan()}
          style={styles.viewPlanButton}
          contentStyle={styles.viewPlanButtonContent}
          icon="eye"
        >
          Ver Plan Completo
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 16, color: "#666" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 20 },
  errorTitle: { fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  errorText: { color: "#666", textAlign: "center" },
  card: { marginBottom: 20, elevation: 2, borderRadius: 16 },
  cardTitle: { fontWeight: "600", color: "#1a1a1a", marginBottom: 16 },
  cardDescription: { color: "#666", marginBottom: 16 },
  measurementsGrid: { flexDirection: "row", justifyContent: "space-around" },
  measurement: { alignItems: "center" },
  measurementValue: { fontWeight: "bold", color: "#4a90e2", marginBottom: 4 },
  measurementLabel: { color: "#666" },
  nutritionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  nutritionItem: { width: "48%", alignItems: "center", marginBottom: 16, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 12 },
  nutritionValue: { fontWeight: "bold", color: "#50c878", marginBottom: 4 },
  nutritionLabel: { color: "#666" },
  weeklyStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  weeklyStat: { alignItems: "center" },
  weeklyStatValue: { fontWeight: "bold", color: "#4a90e2", marginBottom: 4 },
  weeklyStatLabel: { color: "#666" },
  trainingPreview: { gap: 12 },
  dayPreview: { padding: 12, backgroundColor: "#f8f9fa", borderRadius: 12 },
  dayName: { fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  sessionsPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sessionChip: { backgroundColor: "#e3f2fd" },
  sessionChipText: { color: "#1976d2", fontSize: 12 },
  moreText: { color: "#666", textAlign: "center", fontStyle: "italic" },
  viewPlanButton: { borderRadius: 12, backgroundColor: "#4a90e2", marginBottom: 32 },
  viewPlanButtonContent: { paddingVertical: 8 },
})
