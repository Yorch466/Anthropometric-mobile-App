// src/screens/ResultsScreen.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, Button, ActivityIndicator, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import BottomActionBar from "@/components/BottomActivationBar" // <-- si tu archivo es BottomActivationBar, cambia este import

// ---------- Tipos de navegación ----------
type RootStackParamList = {
  Results: { uploadId?: string; predId?: string; planId?: string; result?: any } | undefined
  PlanDetail: { planId: string }
}

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, "Results">
type ResultsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Results">
type ResultsRoute = RouteProp<RootStackParamList, "Results">

// ---------- Tipos de datos (igual a tu versión) ----------
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

// ---------- Colores EMI ----------
const emiBlue = "#0052a5"
const emiGold = "#e9b400"
const bg = "#f8f9fa"
const muted = "#666"

// ---------- Componente ----------
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

        // --- predictions/{predId} ---
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

        // --- plans/{planId} ---
        const planRef = doc(db, "plans", String(planId))
        const planSnap = await getDoc(planRef)
        if (!planSnap.exists()) throw new Error("No se encontró el plan.")
        const raw = planSnap.data() as any

        const p = raw?.plan ?? {}
        const nutrition = p?.nutrition ?? {}
        const targets = nutrition?.targets_per_day ?? {}
        const trainingRaw: any[] = Array.isArray(p?.training) ? p.training : []

        // normaliza training
        const training: TrainingDay[] = trainingRaw.map((d: any, idx: number) => ({
          day: d?.day ?? idx + 1,
          sessions: Array.isArray(d?.sessions) ? d.sessions : [],
        }))

        // cuenta sesiones por tipo
        const totals = training.reduce(
          (acc, d) => {
            (d.sessions || []).forEach((s: Session) => {
              if (s?.type === "run") acc.runs += 1
              if (s?.type === "strength") acc.str += 1
            })
            return acc
          },
          { runs: 0, str: 0 },
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
        <ActivityIndicator size="large" color={emiBlue} />
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
        <Text style={{ marginTop: 8, color: muted }}>
          uploadId: {String(uploadId ?? "")}
          {"\n"}predId: {String(predId ?? "")}
          {"\n"}planId: {String(planId ?? "")}
        </Text>
      </View>
    )
  }

  const trainingToShow = Array.isArray(plan.training) ? plan.training.slice(0, 3) : []

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Medidas */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Ionicons name="body-outline" size={24} color={emiBlue} />
              <Text variant="headlineSmall" style={styles.cardTitle}>Medidas Corporales</Text>
            </View>
            <View style={styles.measurementsGrid}>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>{prediction.height_m.toFixed(2)}m</Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>Altura</Text>
              </View>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>{prediction.weight_kg.toFixed(1)}kg</Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>Peso</Text>
              </View>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>{prediction.class_name}</Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>Clasificación</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Nutrición */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Ionicons name="nutrition-outline" size={24} color={emiBlue} />
              <Text variant="headlineSmall" style={styles.cardTitle}>Nutrición Diaria</Text>
            </View>
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
            <View style={styles.cardHeader}>
              <Ionicons name="fitness-outline" size={24} color={emiBlue} />
              <Text variant="headlineSmall" style={styles.cardTitle}>Plan Semanal</Text>
            </View>

            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <View style={styles.weeklyStatCircle}>
                  <Text variant="titleLarge" style={styles.weeklyStatValue}>{plan.runs_per_wk}</Text>
                </View>
                <Text variant="bodyMedium" style={styles.weeklyStatLabel}>Carreras/semana</Text>
              </View>
              <View style={styles.weeklyStat}>
                <View style={styles.weeklyStatCircle}>
                  <Text variant="titleLarge" style={styles.weeklyStatValue}>{plan.strength_per_wk}</Text>
                </View>
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
                <Text style={{ color: muted }}>No hay sesiones para mostrar.</Text>
              )}

              {Array.isArray(plan.training) && plan.training.length > 3 && (
                <Text variant="bodyMedium" style={styles.moreText}>+{plan.training.length - 3} días más</Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleViewFullPlan}
          style={styles.viewPlanButton}
          contentStyle={styles.viewPlanButtonContent}
          icon="eye"
        >
          Ver Plan Completo
        </Button>

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomActionBar />
    </View>
  )
}

// ---------- Estilos ----------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bg, justifyContent: "space-between" },
  container: { flex: 1, backgroundColor: bg },
  content: { padding: 20 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg },
  loadingText: { marginTop: 16, color: muted },

  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg, padding: 20 },
  errorTitle: { fontWeight: "600", color: emiBlue, marginBottom: 8 },
  errorText: { color: muted, textAlign: "center" },

  card: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: emiBlue,
    shadowColor: emiBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontWeight: "700", color: emiBlue, marginLeft: 8, fontSize: 20 },

  // Medidas
  measurementsGrid: { flexDirection: "row", justifyContent: "space-around" },
  measurement: { alignItems: "center" },
  measurementValue: { fontWeight: "bold", color: emiGold, marginBottom: 4 },
  measurementLabel: { color: muted, fontWeight: "500" },

  // Nutrición
  nutritionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  nutritionItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: emiGold,
  },
  nutritionValue: { fontWeight: "bold", color: emiBlue, marginBottom: 4 },
  nutritionLabel: { color: muted, fontWeight: "500" },

  // Semanal
  weeklyStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  weeklyStat: { alignItems: "center" },
  weeklyStatCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: emiGold, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  weeklyStatValue: { fontWeight: "bold", color: "#FFFFFF" },
  weeklyStatLabel: { color: muted, fontWeight: "500", textAlign: "center" },

  trainingPreview: { gap: 12 },
  dayPreview: { padding: 16, backgroundColor: "#fff8e1", borderRadius: 12, borderLeftWidth: 3, borderLeftColor: emiGold },
  dayName: { fontWeight: "600", color: emiBlue, marginBottom: 8, fontSize: 16 },
  sessionsPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sessionChip: { backgroundColor: "#e3f2fd", borderColor: emiBlue, borderWidth: 1 },
  sessionChipText: { color: emiBlue, fontSize: 12, fontWeight: "500" },
  moreText: { color: muted, textAlign: "center", fontStyle: "italic" },

  viewPlanButton: { borderRadius: 12, backgroundColor: emiGold, marginBottom: 12, elevation: 3 },
  viewPlanButtonContent: { paddingVertical: 12 },
})
