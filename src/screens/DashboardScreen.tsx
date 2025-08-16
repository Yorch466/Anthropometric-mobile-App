"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { Card, Text, IconButton } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { getCurrentUserId } from "../lib/firebase"
import { getUserUploads, getPrediction, getPlan } from "../lib/firestore"
import type { Upload, Prediction, Plan } from "../types"

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, "Dashboard">

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>()
  const [lastResult, setLastResult] = useState<{
    upload: Upload
    prediction: Prediction
    plan: Plan
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLastResult()
  }, [])

  const loadLastResult = async () => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return

      const uploads = await getUserUploads(userId, 1)
      const lastUpload = uploads.find((u) => u.status === "planned")

      if (lastUpload && lastUpload.predId && lastUpload.planId) {
        const [prediction, plan] = await Promise.all([getPrediction(lastUpload.predId), getPlan(lastUpload.planId)])

        if (prediction && plan) {
          setLastResult({ upload: lastUpload, prediction, plan })
        }
      }
    } catch (error) {
      console.error("Error loading last result:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadPhoto = () => {
    navigation.navigate("Upload")
  }

  const handleViewHistory = () => {
    navigation.navigate("History")
  }

  const handleViewPlan = () => {
    if (lastResult?.plan) {
      navigation.navigate("PlanDetail", { planId: lastResult.plan.id })
    }
  }

  const handleViewResults = () => {
    if (lastResult) {
      navigation.navigate("Results", {
        uploadId: lastResult.upload.id,
        predId: lastResult.prediction.id,
        planId: lastResult.plan.id,
      })
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text variant="headlineMedium" style={styles.welcomeTitle}>
            Bienvenido
          </Text>
          <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
            Tu progreso fitness personalizado
          </Text>
        </View>

        {/* Last Result Card */}
        {lastResult ? (
          <TouchableOpacity onPress={handleViewResults} activeOpacity={0.7}>
            <Card style={styles.resultCard}>
              <Card.Content>
                <View style={styles.resultHeader}>
                  <Text variant="titleLarge" style={styles.resultTitle}>
                    Último Análisis
                  </Text>
                  <IconButton icon="chevron-right" size={20} />
                </View>
                <View style={styles.resultMetrics}>
                  <View style={styles.metric}>
                    <Text variant="headlineSmall" style={styles.metricValue}>
                      {lastResult.prediction.height_m.toFixed(2)}m
                    </Text>
                    <Text variant="bodyMedium" style={styles.metricLabel}>
                      Altura
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text variant="headlineSmall" style={styles.metricValue}>
                      {lastResult.prediction.weight_kg.toFixed(1)}kg
                    </Text>
                    <Text variant="bodyMedium" style={styles.metricLabel}>
                      Peso
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text variant="headlineSmall" style={styles.metricValue}>
                      {lastResult.prediction.class_name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.metricLabel}>
                      Clasificación
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <IconButton icon="camera-plus" size={48} iconColor="#4a90e2" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Sin análisis previos
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Sube tu primera foto para comenzar
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Acciones Rápidas
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleUploadPhoto}>
              <Card style={styles.actionCard}>
                <Card.Content style={styles.actionContent}>
                  <IconButton icon="camera-plus" size={32} iconColor="#4a90e2" />
                  <Text variant="titleMedium" style={styles.actionText}>
                    Subir Foto
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
              <Card style={styles.actionCard}>
                <Card.Content style={styles.actionContent}>
                  <IconButton icon="history" size={32} iconColor="#4a90e2" />
                  <Text variant="titleMedium" style={styles.actionText}>
                    Mi Historial
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleViewPlan} disabled={!lastResult}>
              <Card style={[styles.actionCard, !lastResult && styles.disabledCard]}>
                <Card.Content style={styles.actionContent}>
                  <IconButton icon="clipboard-text" size={32} iconColor={lastResult ? "#4a90e2" : "#ccc"} />
                  <Text variant="titleMedium" style={[styles.actionText, !lastResult && styles.disabledText]}>
                    Mi Plan
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mini Widgets */}
        {lastResult && (
          <View style={styles.widgetsSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Resumen Diario
            </Text>
            <View style={styles.widgets}>
              <Card style={styles.widget}>
                <Card.Content style={styles.widgetContent}>
                  <IconButton icon="fire" size={24} iconColor="#ff6b35" />
                  <Text variant="headlineSmall" style={styles.widgetValue}>
                    {lastResult.plan.kcal}
                  </Text>
                  <Text variant="bodySmall" style={styles.widgetLabel}>
                    Calorías diarias
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.widget}>
                <Card.Content style={styles.widgetContent}>
                  <IconButton icon="dumbbell" size={24} iconColor="#50c878" />
                  <Text variant="headlineSmall" style={styles.widgetValue}>
                    {lastResult.plan.strength_per_wk}
                  </Text>
                  <Text variant="bodySmall" style={styles.widgetLabel}>
                    Sesiones/semana
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.widget}>
                <Card.Content style={styles.widgetContent}>
                  <IconButton icon="run" size={24} iconColor="#4a90e2" />
                  <Text variant="headlineSmall" style={styles.widgetValue}>
                    {lastResult.plan.runs_per_wk}
                  </Text>
                  <Text variant="bodySmall" style={styles.widgetLabel}>
                    Carreras/semana
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </View>
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: "#666",
  },
  resultCard: {
    marginBottom: 24,
    elevation: 2,
    borderRadius: 16,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
  resultMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  metric: {
    alignItems: "center",
  },
  metricValue: {
    fontWeight: "bold",
    color: "#4a90e2",
    marginBottom: 4,
  },
  metricLabel: {
    color: "#666",
  },
  emptyCard: {
    marginBottom: 24,
    elevation: 2,
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#666",
    textAlign: "center",
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionCard: {
    elevation: 2,
    borderRadius: 12,
  },
  actionContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  actionText: {
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "center",
  },
  disabledCard: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#ccc",
  },
  widgetsSection: {
    marginBottom: 24,
  },
  widgets: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  widget: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  widgetContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  widgetValue: {
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  widgetLabel: {
    color: "#666",
    textAlign: "center",
  },
})
