"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, Button, ActivityIndicator, Chip } from "react-native-paper"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { getPrediction, getPlan } from "../lib/firestore"
import type { Prediction, Plan } from "../types"

type ResultsScreenProps = NativeStackScreenProps<RootStackParamList, "Results">
type ResultsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Results">

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<ResultsNavigationProp>()
  const route = useRoute<ResultsScreenProps["route"]>()
  const { predId, planId } = route.params

  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [predId, planId])

  const loadData = async () => {
    try {
      const [predictionData, planData] = await Promise.all([getPrediction(predId), getPlan(planId)])
      setPrediction(predictionData)
      setPlan(planData)
    } catch (error) {
      console.error("Error loading results:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewFullPlan = () => {
    navigation.navigate("PlanDetail", { planId })
  }

  const getDayName = (day: number): string => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return days[day - 1] || `Día ${day}`
  }

  const getSessionDescription = (session: any): string => {
    if (session.type === "run") {
      return `Correr ${session.minutes} min`
    } else if (session.type === "strength") {
      return `Fuerza ${session.sets} sets`
    } else if (session.type === "core") {
      return `Core ${session.minutes} min`
    }
    return session.type
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando resultados...
        </Text>
      </View>
    )
  }

  if (!prediction || !plan) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall" style={styles.errorTitle}>
          Error al cargar datos
        </Text>
        <Text variant="bodyLarge" style={styles.errorText}>
          No se pudieron cargar los resultados
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Body Measurements */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Medidas Corporales
            </Text>
            <View style={styles.measurementsGrid}>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>
                  {prediction.height_m.toFixed(2)}m
                </Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>
                  Altura
                </Text>
              </View>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>
                  {prediction.weight_kg.toFixed(1)}kg
                </Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>
                  Peso
                </Text>
              </View>
              <View style={styles.measurement}>
                <Text variant="headlineMedium" style={styles.measurementValue}>
                  {prediction.class_name}
                </Text>
                <Text variant="bodyMedium" style={styles.measurementLabel}>
                  Clasificación
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Daily Nutrition */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Nutrición Diaria
            </Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>
                  {plan.kcal}
                </Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>
                  Calorías
                </Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>
                  {plan.protein_g}g
                </Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>
                  Proteína
                </Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>
                  {plan.fat_g}g
                </Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>
                  Grasas
                </Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleLarge" style={styles.nutritionValue}>
                  {plan.carbs_g}g
                </Text>
                <Text variant="bodyMedium" style={styles.nutritionLabel}>
                  Carbohidratos
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Weekly Training Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Plan Semanal
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Resumen de tu entrenamiento semanal
            </Text>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text variant="titleLarge" style={styles.weeklyStatValue}>
                  {plan.runs_per_wk}
                </Text>
                <Text variant="bodyMedium" style={styles.weeklyStatLabel}>
                  Carreras/semana
                </Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text variant="titleLarge" style={styles.weeklyStatValue}>
                  {plan.strength_per_wk}
                </Text>
                <Text variant="bodyMedium" style={styles.weeklyStatLabel}>
                  Fuerza/semana
                </Text>
              </View>
            </View>

            {/* Training Days Preview */}
            <View style={styles.trainingPreview}>
              {plan.training.slice(0, 3).map((day) => (
                <View key={day.day} style={styles.dayPreview}>
                  <Text variant="titleMedium" style={styles.dayName}>
                    {getDayName(day.day)}
                  </Text>
                  <View style={styles.sessionsPreview}>
                    {day.sessions.map((session, index) => (
                      <Chip key={index} style={styles.sessionChip} textStyle={styles.sessionChipText}>
                        {getSessionDescription(session)}
                      </Chip>
                    ))}
                  </View>
                </View>
              ))}
              {plan.training.length > 3 && (
                <Text variant="bodyMedium" style={styles.moreText}>
                  +{plan.training.length - 3} días más
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* View Full Plan Button */}
        <Button
          mode="contained"
          onPress={handleViewFullPlan}
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
  measurementsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  measurement: {
    alignItems: "center",
  },
  measurementValue: {
    fontWeight: "bold",
    color: "#4a90e2",
    marginBottom: 4,
  },
  measurementLabel: {
    color: "#666",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  nutritionValue: {
    fontWeight: "bold",
    color: "#50c878",
    marginBottom: 4,
  },
  nutritionLabel: {
    color: "#666",
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  weeklyStat: {
    alignItems: "center",
  },
  weeklyStatValue: {
    fontWeight: "bold",
    color: "#4a90e2",
    marginBottom: 4,
  },
  weeklyStatLabel: {
    color: "#666",
  },
  trainingPreview: {
    gap: 12,
  },
  dayPreview: {
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  dayName: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  sessionsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sessionChip: {
    backgroundColor: "#e3f2fd",
  },
  sessionChipText: {
    color: "#1976d2",
    fontSize: 12,
  },
  moreText: {
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  viewPlanButton: {
    borderRadius: 12,
    backgroundColor: "#4a90e2",
    marginBottom: 32,
  },
  viewPlanButtonContent: {
    paddingVertical: 8,
  },
})
