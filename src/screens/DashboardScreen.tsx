// src/screens/DashboardScreen.tsx
"use client"

import React, { useState, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Text, Chip, Button, IconButton, ActivityIndicator } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "@/navigation/AppNavigator"
import { getCurrentUserId } from "@/hooks/auth"
import { getUserUploads, getPrediction, getPlan } from "@/lib/firestore"
import type { Upload, Prediction, Plan } from "@/types"

import BottomActionBar from "@/components/BottomActivationBar"

// === Colores EMI ===
const emiBlue = "#0052a5"
const emiGold = "#e9b400"
const bg = "#f5f7fb"
const surface = "#ffffff"
const muted = "#6b7280"

type Nav = NativeStackNavigationProp<RootStackParamList, "Dashboard">

export const DashboardScreen: React.FC = () => {
  const nav = useNavigation<Nav>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [last, setLast] = useState<{ upload: Upload; prediction: Prediction; plan: Plan } | null>(null)

  // refresca siempre al volver a enfocarse
  useFocusEffect(
    useCallback(() => {
      load()
      const t = setTimeout(load, 700) // segundo “tick” por propagación de Firestore
      return () => clearTimeout(t)
    }, []),
  )

  const load = async () => {
    setLoading(true)
    try {
      const uid = getCurrentUserId()
      if (!uid) return

      const r = (await getUserUploads(uid, 5, null)) as any
      const items: Upload[] = Array.isArray(r) ? r : (r?.items ?? [])

      const ready = items.find(
        (u) => (u.status === "planned" || u.status === "completed") && u.predId && u.planId,
      )

      if (ready?.predId && ready?.planId) {
        const [pred, plan] = await Promise.all([
          getPrediction(String(ready.predId)),
          getPlan(String(ready.planId)),
        ])
        if (pred && plan) setLast({ upload: ready, prediction: pred, plan })
        else setLast(null)
      } else {
        setLast(null)
      }
    } catch (e) {
      console.error("Dashboard load error:", e)
      setLast(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const dietTargets =
    last
      ? [
          { k: "kcal", v: last.plan?.kcal ?? 0, u: "" },
          { k: "Proteína", v: last.plan?.protein_g ?? 0, u: "g" },
          { k: "Grasas", v: last.plan?.fat_g ?? 0, u: "g" },
          { k: "Carbs", v: last.plan?.carbs_g ?? 0, u: "g" },
        ]
      : []

  const trainingPreview = Array.isArray(last?.plan?.training) ? last!.plan.training.slice(0, 3) : []
  const mealsPreview = Array.isArray(last?.plan?.meals_example) ? last!.plan.meals_example.slice(0, 2) : []

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.headerTitle}>EMI Fitness</Text>
        <IconButton icon="refresh" onPress={load} iconColor="#fff" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[emiBlue]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Última medición */}
        <Card style={styles.heroCard} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.heroTitle}>Última medición</Text>
            {loading ? (
              <View style={styles.centerRow}><ActivityIndicator /></View>
            ) : last ? (
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text variant="headlineSmall" style={styles.metricValue}>{last.prediction.height_m.toFixed(2)}m</Text>
                  <Text style={styles.metricLabel}>Altura</Text>
                </View>
                <View style={styles.metric}>
                  <Text variant="headlineSmall" style={styles.metricValue}>{last.prediction.weight_kg.toFixed(1)}kg</Text>
                  <Text style={styles.metricLabel}>Peso</Text>
                </View>
                <View style={styles.metric}>
                  <Text variant="headlineSmall" style={styles.metricValue}>{last.prediction.class_name}</Text>
                  <Text style={styles.metricLabel}>Estado</Text>
                </View>
              </View>
            ) : (
              <Text style={{ color: "#223", opacity: 0.8 }}>Aún no tienes mediciones.</Text>
            )}

            <View style={styles.heroActions}>
              <Button mode="contained" onPress={() => nav.navigate("Upload")} buttonColor={emiBlue}>
                Subir foto
              </Button>
              {last && (
                <Button
                  mode="outlined"
                  onPress={() =>
                    nav.navigate("Results", {
                      uploadId: last.upload.id,
                      predId: last.prediction.id,
                      planId: last.plan.id,
                    })
                  }
                  textColor={emiBlue}
                >
                  Ver resultados
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Chips “cosas extra” */}
        <View style={styles.chipsRow}>
          <Chip onPress={() => {}} style={styles.chip} textStyle={styles.chipText}>Principiante</Chip>
          <Chip onPress={() => {}} style={styles.chip} textStyle={styles.chipText}>Bajar de peso</Chip>
          <Chip onPress={() => {}} style={styles.chip} textStyle={styles.chipText}>Fuerza</Chip>
        </View>

        {/* Rutina (resumen) */}
        <Card style={styles.blockCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.blockTitle}>Rutina (resumen)</Text>
            {last ? (
              <View style={{ gap: 8 }}>
                {trainingPreview.map((d: any, i: number) => (
                  <View key={i} style={styles.listRow}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>
                      {d.day}: {Array.isArray(d.sessions) ? d.sessions.map((s: any) => s.type).join(" · ") : "—"}
                    </Text>
                  </View>
                ))}
                <Button onPress={() => nav.navigate("PlanDetail", { planId: last.plan.id })} textColor={emiBlue}>
                  Ver plan completo
                </Button>
              </View>
            ) : (
              <Text style={{ color: muted }}>Sube una foto para obtener tu rutina.</Text>
            )}
          </Card.Content>
        </Card>

        {/* Dieta (resumen) */}
        <Card style={styles.blockCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.blockTitle}>Dieta (resumen)</Text>
            {last ? (
              <>
                <View style={styles.targetsRow}>
                  {dietTargets.map((t) => (
                    <View key={t.k} style={styles.targetPill}>
                      <Text style={styles.targetVal}>
                        {t.v}{t.u}
                      </Text>
                      <Text style={styles.targetLabel}>{t.k}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {mealsPreview.map((m: any, i: number) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{m?.title ?? "Comida"} — {m?.kcal ?? 0} kcal</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ color: muted }}>Aún no hay dieta generada.</Text>
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar (tu componente) */}
      <BottomActionBar />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: bg },
  header: {
    backgroundColor: emiBlue,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontWeight: "700" },

  scroll: { padding: 16 },

  heroCard: {
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: surface,
  },
  heroTitle: { marginBottom: 12, fontWeight: "700", color: "#111" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  metric: {
    flex: 1,
    backgroundColor: "#eef4ff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9e5ff",
  },
  metricValue: { color: emiBlue, fontWeight: "800" },
  metricLabel: { color: muted, marginTop: 2, fontSize: 12 },
  centerRow: { alignItems: "center", justifyContent: "center" },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 12 },

  chipsRow: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 },
  chip: { backgroundColor: emiGold, borderRadius: 20 },
  chipText: { color: "#fff", fontWeight: "600" },

  blockCard: {
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: surface,
  },
  blockTitle: { fontWeight: "700", marginBottom: 8, color: "#111" },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  listBullet: { color: emiGold, marginTop: 2, fontSize: 18, lineHeight: 18 },
  listText: { flex: 1, color: "#1f2937" },

  targetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  targetPill: {
    backgroundColor: "#fff7e0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F1E0A0",
  },
  targetVal: { fontWeight: "700", color: emiGold },
  targetLabel: { fontSize: 12, color: muted },
})
