// src/screens/DashboardScreen.tsx
"use client"

import React, { useState, useCallback } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Card, Text, Chip, Button, IconButton, ActivityIndicator } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "@/navigation/AppNavigator"
import { emiTheme } from "@/theme/emitheme"
import { getCurrentUserId } from "@/hooks/auth"
import { getUserUploads, getPrediction, getPlan } from "@/lib/firestore"
import BottomActionBar from "@/components/BottomActivationBar"
import type { Upload, Prediction, Plan } from "@/types"
import { useTheme } from "react-native-paper"
import type { AppTheme } from "@/theme/emitheme"

type Nav = NativeStackNavigationProp<RootStackParamList, "Dashboard">
const theme = useTheme<AppTheme>()


export const DashboardScreen: React.FC = () => {
  const nav = useNavigation<Nav>()
  const [loading, setLoading] = useState(true)
  const [last, setLast] = useState<{ upload: Upload; prediction: Prediction; plan: Plan } | null>(null)

  useFocusEffect(useCallback(() => { load(); }, []))

  const load = async () => {
    setLoading(true)
    try {
      const uid = getCurrentUserId()
      if (!uid) return
      const { items } = await getUserUploads(uid, 5, null)
      const ready = items.find(u => (u.status === "planned" || u.status === "completed") && u.predId && u.planId)
      if (ready?.predId && ready?.planId) {
        const [pred, plan] = await Promise.all([getPrediction(String(ready.predId)), getPlan(String(ready.planId))])
        if (pred && plan) setLast({ upload: ready, prediction: pred, plan })
        else setLast(null)
      } else setLast(null)
    } finally { setLoading(false) }
  }

  const dietTargets = last ? [
    { k: "kcal", v: last.plan.kcal, u: "" },
    { k: "Proteína", v: last.plan.protein_g, u: "g" },
    { k: "Grasas", v: last.plan.fat_g, u: "g" },
    { k: "Carbs", v: last.plan.carbs_g, u: "g" },
  ] : []

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.topBar}>
          <Text variant="headlineSmall" style={styles.title}>Home — EMI Fitness</Text>
          <IconButton icon="bell-outline" onPress={() => {}} />
        </View>

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
              <Text style={{ color: emiTheme.colors.onSurface }}>Aún no tienes mediciones.</Text>
            )}

            <View style={styles.heroActions}>
              <Button mode="contained" onPress={() => nav.navigate("Upload")}>Subir foto</Button>
              {last && (
                <Button mode="outlined" onPress={() => nav.navigate("Results", {
                  uploadId: last.upload.id, predId: last.prediction.id, planId: last.plan.id
                })}>
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

        {/* Rutina superficial */}
        <Card style={styles.blockCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.blockTitle}>Rutina (resumen)</Text>
            {last ? (
              <View style={{ gap: 8 }}>
                {last.plan.training.slice(0, 3).map((d, i) => (
                  <View key={i} style={styles.listRow}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>
                      {d.day}: {d.sessions.map((s: any) => s.type).join(" · ")}
                    </Text>
                  </View>
                ))}
                <Button onPress={() => nav.navigate("PlanDetail", { planId: last.plan.id })}>
                  Ver plan completo
                </Button>
              </View>
            ) : (
              <Text style={{ color: theme.custom.muted }}>Sube una foto para obtener tu rutina.</Text>
            )}
          </Card.Content>
        </Card>

        {/* Dieta superficial */}
        <Card style={styles.blockCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.blockTitle}>Dieta (resumen)</Text>
            {last ? (
              <>
                <View style={styles.targetsRow}>
                  {dietTargets.map(t => (
                    <View key={t.k} style={styles.targetPill}>
                      <Text style={styles.targetVal}>{t.v}{t.u}</Text>
                      <Text style={styles.targetLabel}>{t.k}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {last.plan.meals_example.slice(0, 2).map((m, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{m.title} — {m.kcal} kcal</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ color: theme.custom.muted }}>Aún no hay dieta generada.</Text>
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 70 }} />
      </ScrollView>

      <BottomActionBar />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: emiTheme.colors.background },
  scroll: { padding: 16 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { color: emiTheme.colors.primary, fontWeight: "700" },

  heroCard: { borderRadius: 16, marginTop: 8 },
  heroTitle: { marginBottom: 12, fontWeight: "700" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  metric: { flex: 1, backgroundColor: emiTheme.colors.surfaceVariant, borderRadius: 12, padding: 12, alignItems: "center" },
  metricValue: { color: emiTheme.colors.primary, fontWeight: "800" },
  metricLabel: { color: theme.custom.muted, marginTop: 2, fontSize: 12 },
  centerRow: { alignItems: "center", justifyContent: "center" },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 12 },

  chipsRow: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: 8 },
  chip: { backgroundColor: emiTheme.colors.primary, borderRadius: 20 },
  chipText: { color: "#fff" },

  blockCard: { borderRadius: 16, marginTop: 12 },
  blockTitle: { fontWeight: "700", marginBottom: 8 },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  listBullet: { color: emiTheme.colors.secondary, marginTop: 2 },
  listText: { flex: 1, color: emiTheme.colors.onSurface },

  targetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  targetPill: { backgroundColor: "#fff7e0", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#F1E0A0" },
  targetVal: { fontWeight: "700", color: emiTheme.colors.secondary },
  targetLabel: { fontSize: 12, color: theme.custom.muted },
})
