// src/screens/PlanDetailScreen.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, ActivityIndicator, Chip } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useRoute } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { getPlan } from "../lib/firestore"
import type { Plan } from "../types"
import BottomActionBar from "@/components/BottomActivationBar" // <- si tu archivo es BottomActivationBar, cambia este import

type PlanDetailScreenProps = NativeStackScreenProps<RootStackParamList, "PlanDetail">

const emiBlue = "#0052a5"
const emiGold = "#e9b400"
const bg = "#f8f9fa"
const muted = "#666"

export const PlanDetailScreen: React.FC = () => {
  const route = useRoute<PlanDetailScreenProps["route"]>()
  const { planId } = route.params

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  const loadPlan = async () => {
    try {
      const planData = await getPlan(planId) // devuelve el doc crudo
      const normalized = normalizePlan(planData)
      setPlan(normalized as any)
    } catch (error) {
      console.error("Error loading plan:", error)
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={emiBlue} />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando plan detallado...</Text>
      </View>
    )
  }

  const getDayName = (day: number | string): string => {
    if (typeof day === "string") return day
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return days[day - 1] || `Día ${day}`
  }

  const getSessionDescription = (session: any): string => {
    if (session?.type === "run") return `Correr ${session.minutes ?? "-"} minutos`
    if (session?.type === "strength") return `Fuerza — ${session.sets ?? session.pushups_sets ?? "-"} sets`
    if (session?.type === "core") return `Core — ${session.minutes ?? session.situps_sets ?? "-"}`
    return session?.type ?? "-"
  }

  const getSessionIcon = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (type) {
      case "run": return "run"
      case "strength": return "dumbbell"
      case "core": return "meditation"
      default: return "arm-flex-outline"
    }
  }

  const getTagColor = (tag: string): string => {
    switch ((tag || "").toLowerCase()) {
      case "vegano":
      case "vegan": return "#4caf50"
      case "sin gluten":
      case "gluten_free": return emiGold
      case "sin lactosa":
      case "lactose_free": return emiBlue
      default: return "#9e9e9e"
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={emiBlue} />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando plan detallado...</Text>
      </View>
    )
  }

  // arriba del componente o dentro del archivo
type Session = {
  type?: "run" | "strength" | "core" | string
  minutes?: number
  sets?: number
  pushups_sets?: number
  situps_sets?: number
  exercises?: string[]
}

type TrainingDay = { day: number | string; sessions: Session[] }

function normalizePlan(raw: any) {
  // algunos backends guardan en "plan"
  const p = raw?.plan ? raw.plan : raw ?? {}

  // asegurar training en formato homogéneo
  const trainingArray: TrainingDay[] = Array.isArray(p.training)
    ? p.training.map((d: any, idx: number) => ({
        day: d?.day ?? idx + 1,
        sessions: Array.isArray(d?.sessions) ? d.sessions : [],
      }))
    : []

  // contar sesiones por tipo
  const totals = trainingArray.reduce(
    (acc, d) => {
      d.sessions.forEach((s: Session) => {
        const t = (s?.type || "").toLowerCase()
        if (t === "run") acc.runs += 1
        if (t === "strength") acc.str += 1
      })
      return acc
    },
    { runs: 0, str: 0 }
  )

  // nutrición puede venir en p.nutrition.targets_per_day
  const targets = p?.nutrition?.targets_per_day ?? {}

  return {
    kcal: p?.kcal ?? targets?.kcal ?? null,
    protein_g: p?.protein_g ?? targets?.protein_g ?? null,
    fat_g: p?.fat_g ?? targets?.fat_g ?? null,
    carbs_g: p?.carbs_g ?? targets?.carbs_g ?? null,
    runs_per_wk: p?.runs_per_wk ?? totals.runs,
    strength_per_wk: p?.strength_per_wk ?? totals.str,
    training: trainingArray,
    meals_example: Array.isArray(p?.meals_example) ? p.meals_example : [],
  }
}


  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={emiBlue} />
        <Text variant="headlineSmall" style={styles.errorTitle}>Error al cargar plan</Text>
        <Text variant="bodyLarge" style={styles.errorText}>No se pudo cargar el plan detallado</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Resumen del plan */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={22} color={emiBlue} />
              <Text variant="headlineSmall" style={styles.cardTitle}>Resumen del Plan</Text>
            </View>

            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <View style={styles.overviewIconContainer}>
                  <MaterialCommunityIcons name="fire" size={22} color="#FFFFFF" />
                </View>
                <Text variant="titleLarge" style={styles.overviewValue}>{plan.kcal ?? "-"}</Text>
                <Text variant="bodyMedium" style={styles.overviewLabel}>Calorías diarias</Text>
              </View>

              <View style={styles.overviewItem}>
                <View style={styles.overviewIconContainer}>
                  <MaterialCommunityIcons name="run" size={22} color="#FFFFFF" />
                </View>
                <Text variant="titleLarge" style={styles.overviewValue}>{plan.runs_per_wk ?? 0}</Text>
                <Text variant="bodyMedium" style={styles.overviewLabel}>Carreras/semana</Text>
              </View>

              <View style={styles.overviewItem}>
                <View style={styles.overviewIconContainer}>
                  <MaterialCommunityIcons name="dumbbell" size={22} color="#FFFFFF" />
                </View>
                <Text variant="titleLarge" style={styles.overviewValue}>{plan.strength_per_wk ?? 0}</Text>
                <Text variant="bodyMedium" style={styles.overviewLabel}>Fuerza/semana</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Cronograma semanal */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="calendar-week" size={22} color={emiBlue} />
              <Text variant="headlineSmall" style={styles.cardTitle}>Cronograma Semanal</Text>
            </View>

            <View style={styles.trainingSchedule}>
              {(plan.training ?? []).map((day, idx) => (
                <Card key={`${String(day.day)}-${idx}`} style={styles.dayCard}>
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.dayTitle}>{getDayName(day.day)}</Text>

                    {(day.sessions ?? []).length > 0 ? (
                      <View style={styles.sessions}>
                        {day.sessions.map((session, j) => (
                          <View key={j} style={styles.session}>
                            <View style={styles.sessionHeader}>
                              <MaterialCommunityIcons name={getSessionIcon(session.type)} size={20} color={emiGold} />
                              <Text variant="titleMedium" style={styles.sessionType}>
                                {session.type?.charAt(0).toUpperCase() + session.type?.slice(1)}
                              </Text>
                            </View>
                            <Text variant="bodyMedium" style={styles.sessionDescription}>{getSessionDescription(session)}</Text>

                            {/* Extras opcionales si existen */}
                            {!!session.exercises?.length && (
                              <View style={styles.exList}>
                                {session.exercises.map((ex: string, k: number) => (
                                  <Chip key={k} style={styles.exChip} textStyle={styles.exChipText}>
                                    {ex}
                                  </Chip>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.restDayContainer}>
                        <MaterialCommunityIcons name="sleep" size={20} color="#999" />
                        <Text variant="bodyMedium" style={styles.restDay}>Día de descanso</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Ejemplos de comidas */}
        {Array.isArray(plan.meals_example) && plan.meals_example.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="food-apple" size={22} color={emiBlue} />
                <Text variant="headlineSmall" style={styles.cardTitle}>Ejemplos de Comidas</Text>
              </View>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Sugerencias que se ajustan a tu objetivo nutricional
              </Text>

              <View style={styles.meals}>
                {plan.meals_example.map((meal, i) => (
                  <Card key={i} style={styles.mealCard}>
                    <Card.Content>
                      <View style={styles.mealHeader}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={emiGold} />
                        <Text variant="titleMedium" style={styles.mealTitle}>{meal.title}</Text>
                      </View>

                      <View style={styles.mealNutrition}>
                        <Text variant="bodySmall" style={styles.mealNutritionText}>
                          <Text style={styles.nutritionHighlight}>{meal.kcal} kcal</Text>
                          {"  •  "}{meal.protein_g}g proteína
                          {"  •  "}{meal.fat_g}g grasa
                          {"  •  "}{meal.carbs_g}g carbos
                        </Text>
                      </View>

                      {!!meal.tags?.length && (
                        <View style={styles.mealTags}>
                          {meal.tags.map((tag, t) => {
                            const c = getTagColor(tag)
                            return (
                              <Chip key={t} style={[styles.mealTag, { backgroundColor: c + "22" }]} textStyle={[styles.mealTagText, { color: c }]}>
                                {tag}
                              </Chip>
                            )
                          })}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomActionBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bg, justifyContent: "space-between" },
  container: { flex: 1, backgroundColor: bg },
  content: { padding: 20 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg },
  loadingText: { marginTop: 16, color: muted },

  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg, padding: 20 },
  errorTitle: { fontWeight: "600", color: emiBlue, marginBottom: 8, marginTop: 16 },
  errorText: { color: muted, textAlign: "center" },

  card: {
    marginBottom: 20,
    elevation: 3,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: emiBlue,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontWeight: "700", color: emiBlue, marginLeft: 8 },

  // Overview
  overviewGrid: { flexDirection: "row", justifyContent: "space-around" },
  overviewItem: { alignItems: "center" },
  overviewIconContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: emiGold, justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  overviewValue: { fontWeight: "bold", color: emiBlue, marginBottom: 4 },
  overviewLabel: { color: muted, textAlign: "center" },

  // Training
  trainingSchedule: { gap: 12 },
  dayCard: { elevation: 2, borderRadius: 12, backgroundColor: "#FFFFFF", borderLeftWidth: 3, borderLeftColor: emiGold },
  dayTitle: { fontWeight: "700", color: emiBlue, marginBottom: 12 },
  sessions: { gap: 8 },
  session: { padding: 12, backgroundColor: bg, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: emiBlue },
  sessionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sessionType: { fontWeight: "700", color: emiBlue, marginLeft: 8 },
  sessionDescription: { color: muted },

  exList: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  exChip: { backgroundColor: "#e3f2fd", borderColor: emiBlue, borderWidth: 1, height: 26 },
  exChipText: { color: emiBlue, fontSize: 12, fontWeight: "500",height:20 },

  restDayContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  restDay: { color: "#999", fontStyle: "italic", marginLeft: 8 },

  // Meals
  meals: { gap: 12 },
  mealCard: { elevation: 2, borderRadius: 12, backgroundColor: "#FFFFFF", borderLeftWidth: 3, borderLeftColor: emiGold },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  mealTitle: { fontWeight: "700", color: emiBlue, marginLeft: 8 },
  mealNutrition: { marginBottom: 12 },
  mealNutritionText: { color: muted },
  nutritionHighlight: { color: emiGold, fontWeight: "700" },
  mealTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  mealTag: { height: 28 },
  mealTagText: { fontSize: 12, fontWeight: "600" },

  cardDescription: {
  color: "#6c757d",   // o emiColors.muted si lo tienes
  marginBottom: 16,
},

})
