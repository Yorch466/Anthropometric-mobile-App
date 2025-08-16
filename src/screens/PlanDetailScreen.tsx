"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, ActivityIndicator, Chip } from "react-native-paper"
import { useRoute } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { getPlan } from "../lib/firestore"
import type { Plan } from "../types"

type PlanDetailScreenProps = NativeStackScreenProps<RootStackParamList, "PlanDetail">

export const PlanDetailScreen: React.FC = () => {
  const route = useRoute<PlanDetailScreenProps["route"]>()
  const { planId } = route.params

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlan()
  }, [planId])

  const loadPlan = async () => {
    try {
      const planData = await getPlan(planId)
      setPlan(planData)
    } catch (error) {
      console.error("Error loading plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDayName = (day: number): string => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return days[day - 1] || `Día ${day}`
  }

  const getSessionDescription = (session: any): string => {
    if (session.type === "run") {
      return `Correr ${session.minutes} minutos`
    } else if (session.type === "strength") {
      return `Entrenamiento de fuerza - ${session.sets} sets`
    } else if (session.type === "core") {
      return `Entrenamiento de core - ${session.minutes} minutos`
    }
    return session.type
  }

  const getSessionIcon = (type: string): string => {
    switch (type) {
      case "run":
        return "run"
      case "strength":
        return "dumbbell"
      case "core":
        return "yoga"
      default:
        return "fitness"
    }
  }

  const getTagColor = (tag: string): string => {
    switch (tag.toLowerCase()) {
      case "vegano":
      case "vegan":
        return "#4caf50"
      case "sin gluten":
      case "gluten_free":
        return "#ff9800"
      case "sin lactosa":
      case "lactose_free":
        return "#2196f3"
      default:
        return "#9e9e9e"
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando plan detallado...
        </Text>
      </View>
    )
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall" style={styles.errorTitle}>
          Error al cargar plan
        </Text>
        <Text variant="bodyLarge" style={styles.errorText}>
          No se pudo cargar el plan detallado
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Plan Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Resumen del Plan
            </Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text variant="titleLarge" style={styles.overviewValue}>
                  {plan.kcal}
                </Text>
                <Text variant="bodyMedium" style={styles.overviewLabel}>
                  Calorías diarias
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text variant="titleLarge" style={styles.overviewValue}>
                  {plan.runs_per_wk}
                </Text>
                <Text variant="bodyMedium" style={styles.overviewLabel}>
                  Carreras/semana
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text variant="titleLarge" style={styles.overviewValue}>
                  {plan.strength_per_wk}
                </Text>
                <Text variant="bodyMedium" style={styles.overviewLabel}>
                  Fuerza/semana
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Weekly Training Schedule */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Cronograma Semanal
            </Text>
            <View style={styles.trainingSchedule}>
              {plan.training.map((day) => (
                <Card key={day.day} style={styles.dayCard}>
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.dayTitle}>
                      {getDayName(day.day)}
                    </Text>
                    {day.sessions.length > 0 ? (
                      <View style={styles.sessions}>
                        {day.sessions.map((session, index) => (
                          <View key={index} style={styles.session}>
                            <View style={styles.sessionHeader}>
                              <Text variant="titleMedium" style={styles.sessionType}>
                                {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                              </Text>
                            </View>
                            <Text variant="bodyMedium" style={styles.sessionDescription}>
                              {getSessionDescription(session)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text variant="bodyMedium" style={styles.restDay}>
                        Día de descanso
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Meal Examples */}
        {plan.meals_example && plan.meals_example.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.cardTitle}>
                Ejemplos de Comidas
              </Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Sugerencias de comidas que se ajustan a tu plan nutricional
              </Text>
              <View style={styles.meals}>
                {plan.meals_example.map((meal, index) => (
                  <Card key={index} style={styles.mealCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.mealTitle}>
                        {meal.title}
                      </Text>
                      <View style={styles.mealNutrition}>
                        <Text variant="bodySmall" style={styles.mealNutritionText}>
                          {meal.kcal} kcal • {meal.protein_g}g proteína • {meal.fat_g}g grasa • {meal.carbs_g}g
                          carbohidratos
                        </Text>
                      </View>
                      {meal.tags && meal.tags.length > 0 && (
                        <View style={styles.mealTags}>
                          {meal.tags.map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              style={[styles.mealTag, { backgroundColor: getTagColor(tag) + "20" }]}
                              textStyle={[styles.mealTagText, { color: getTagColor(tag) }]}
                            >
                              {tag}
                            </Chip>
                          ))}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  errorText: {
    color: "#666",
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 16,
  },
  cardTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  cardDescription: {
    color: "#666",
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  overviewItem: {
    alignItems: "center",
  },
  overviewValue: {
    fontWeight: "bold",
    color: "#4a90e2",
    marginBottom: 4,
  },
  overviewLabel: {
    color: "#666",
    textAlign: "center",
  },
  trainingSchedule: {
    gap: 12,
  },
  dayCard: {
    elevation: 1,
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  dayTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  sessions: {
    gap: 8,
  },
  session: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4a90e2",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sessionType: {
    fontWeight: "600",
    color: "#4a90e2",
  },
  sessionDescription: {
    color: "#666",
  },
  restDay: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  meals: {
    gap: 12,
  },
  mealCard: {
    elevation: 1,
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  mealTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  mealNutrition: {
    marginBottom: 12,
  },
  mealNutritionText: {
    color: "#666",
  },
  mealTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  mealTag: {
    height: 28,
  },
  mealTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
})
