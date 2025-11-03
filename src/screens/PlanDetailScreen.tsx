// src/screens/PlanDetailScreen.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, ActivityIndicator, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { getPlan } from "../lib/firestore";
import BottomActionBar from "@/components/BottomActivationBar";
import { normalizePlan, type PlanUI, type Session as PSession, type Extra as PExtra } from "@/lib/plan-ui";
import { logDeep } from "@/utils/log";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


type PlanDetailScreenProps = NativeStackScreenProps<RootStackParamList, "PlanDetail">;

const emiBlue = "#0052a5";
const emiGold = "#e9b400";
const bg = "#f8f9fa";
const muted = "#666";

/* === Paleta por clasificación (0..4) === */
const MORPHO = {
  red:   { accent: "#ef4444", bg: "#fee2e2", chipBg: "#fee2e2", chipText: "#991b1b" },   // extremos (0,4)
  yel:   { accent: "#f59e0b", bg: "#fef3c7", chipBg: "#fff7ed", chipText: "#92400e" },   // riesgo (1,3)
  green: { accent: "#10b981", bg: "#dcfce7", chipBg: "#ecfdf5", chipText: "#065f46" },   // normal (2)
} as const;

const paletteFor = (idx?: number) => {
  switch (idx) {
    case 0: return MORPHO.red;   // desnutrición
    case 1: return MORPHO.yel;   // bajo peso
    case 2: return MORPHO.green; // normal
    case 3: return MORPHO.yel;   // sobrepeso
    case 4: return MORPHO.red;   // obesidad
    default: return { accent: emiBlue, bg: "#e7f1ff", chipBg: "#e3f2fd", chipText: emiBlue };
  }
};

export const PlanDetailScreen: React.FC = () => {
  const route = useRoute<PlanDetailScreenProps["route"]>();
  const { planId } = route.params;

  // color por morfología si llegó desde Results
  const classIdx = (route.params as any)?.class_idx as number | undefined;
  const pal = paletteFor(classIdx);

  const [plan, setPlan] = useState<PlanUI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const loadPlan = async () => {
    try {
      const ref = doc(db, "plans", String(planId));
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Plan no encontrado");

      const raw = snap.data() as any;
      logDeep("[PlanDetailScreen] RAW plan", raw);

      const normalized = normalizePlan(raw);
      logDeep("[PlanDetailScreen] UI plan", normalized);
      console.log("[PlanDetailScreen] meals_example:", normalized.meals_example?.length);

      setPlan(normalized);
    } catch (error) {
      console.error("Error loading plan:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={emiBlue} />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando plan detallado...</Text>
      </View>
    );
  }

  const getDayName = (day: number | string): string => {
    if (typeof day === "string") return day;
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return days[day - 1] || `Día ${day}`;
  };

  const getSessionDescription = (session: PSession): string => {
    const type = (session?.type || "").toLowerCase();
    if (type === "run") {
      const mins = (session as any).minutes ?? (session as any).duration_min ?? "-";
      return `Correr ${mins} minutos`;
    }
    if (type === "strength") {
      const sets = (session as any).sets ?? (session as any).pushups_sets ?? "-";
      return `Fuerza — ${sets} sets`;
    }
    if (type === "core") {
      const v = (session as any).minutes ?? (session as any).situps_sets ?? "-";
      return `Core — ${v}`;
    }
    return session?.type ?? "-";
  };

  const getSessionIcon = (type?: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch ((type || "").toLowerCase()) {
      case "run": return "run";
      case "strength": return "dumbbell";
      case "core": return "meditation";
      default: return "arm-flex-outline";
    }
  };

  const getTagColor = (tag: string): string => {
    switch ((tag || "").toLowerCase()) {
      case "vegano":
      case "vegan": return "#4caf50";
      case "sin gluten":
      case "sin_gluten":
      case "gluten_free": return emiGold;
      case "sin lactosa":
      case "sin_lactosa":
      case "lactose_free": return emiBlue;
      default: return "#9e9e9e";
    }
  };

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={emiBlue} />
        <Text variant="headlineSmall" style={styles.errorTitle}>Error al cargar plan</Text>
        <Text variant="bodyLarge" style={styles.errorText}>No se pudo cargar el plan detallado</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Resumen del plan */}
        <Card style={[styles.card, { borderLeftColor: pal.accent, shadowColor: pal.accent }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={22} color={pal.accent} />
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

        {/* Totales del día (si existen) */}
        {plan.meals_totals && (
          <Card style={[styles.card, { borderLeftColor: pal.accent, shadowColor: pal.accent }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="scale-balance" size={22} color={pal.accent} />
                <Text variant="headlineSmall" style={[styles.cardTitle, { color: pal.accent }]}>
                  Totales del Día
                </Text>
              </View>

              <View style={styles.overviewGridWrap}>
                <View style={styles.overviewItemBox}>
                  <Text variant="titleLarge" style={styles.overviewValue}>{plan.meals_totals.kcal}</Text>
                  <Text style={styles.overviewLabel}>kcal</Text>
                </View>
                <View style={styles.overviewItemBox}>
                  <Text variant="titleLarge" style={styles.overviewValue}>{plan.meals_totals.protein_g} g</Text>
                  <Text style={styles.overviewLabel}>Proteína</Text>
                </View>
                <View style={styles.overviewItemBox}>
                  <Text variant="titleLarge" style={styles.overviewValue}>{plan.meals_totals.fat_g} g</Text>
                  <Text style={styles.overviewLabel}>Grasa</Text>
                </View>
                <View style={styles.overviewItemBox}>
                  <Text variant="titleLarge" style={styles.overviewValue}>{plan.meals_totals.carbs_g} g</Text>
                  <Text style={styles.overviewLabel}>Carbos</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Cronograma semanal */}
        <Card style={[styles.card, { borderLeftColor: pal.accent, shadowColor: pal.accent }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="calendar-week" size={22} color={pal.accent} />
              <Text variant="headlineSmall" style={styles.cardTitle}>Cronograma Semanal</Text>
            </View>

            <View style={styles.trainingSchedule}>
              {(plan.training ?? []).map((day, idx) => (
                <Card key={`${String(day.day)}-${idx}`} style={[styles.dayCard, { borderLeftColor: pal.accent }]}>
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.dayTitle}>{getDayName(day.day)}</Text>

                    {(day.sessions ?? []).length > 0 ? (
                      <View style={styles.sessions}>
                        {day.sessions.map((session, j) => (
                          <View key={j} style={[styles.session, { borderLeftColor: pal.accent }]}>
                            <View style={styles.sessionHeader}>
                              <MaterialCommunityIcons name={getSessionIcon(session.type)} size={20} color={pal.accent} />
                              <Text variant="titleMedium" style={[styles.sessionType, { color: pal.accent }]}>
                                {session.type ? session.type.charAt(0).toUpperCase() + session.type.slice(1) : "Sesión"}
                              </Text>
                            </View>
                            <Text variant="bodyMedium" style={styles.sessionDescription}>
                              {getSessionDescription(session as PSession)}
                            </Text>

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

        {/* Extras proteicos */}
        {Array.isArray(plan.extras) && plan.extras.length > 0 && (
          <Card style={[styles.card, { borderLeftColor: pal.accent, shadowColor: pal.accent }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="food-drumstick" size={22} color={pal.accent} />
                <Text variant="headlineSmall" style={[styles.cardTitle, { color: pal.accent }]}>
                  Extras proteicos (opcional)
                </Text>
              </View>

              <View style={styles.meals}>
                {plan.extras.map((x: PExtra, i: number) => (
                  <Chip
                    key={i}
                    style={{ backgroundColor: pal.bg, marginRight: 6, marginBottom: 6, height: 28 }}
                    textStyle={{ color: pal.accent, fontWeight: "600" }}
                  >
                    {x.title} · {x.protein_g}g P · {x.kcal} kcal
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Ejemplos de comidas */}
        {Array.isArray(plan.meals_example) && plan.meals_example.length > 0 && (
          <Card style={[styles.card, { borderLeftColor: pal.accent, shadowColor: pal.accent }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="food-apple" size={22} color={pal.accent} />
                <Text variant="headlineSmall" style={styles.cardTitle}>Ejemplos de Comidas</Text>
              </View>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Sugerencias que se ajustan a tu objetivo nutricional
              </Text>

              <View style={styles.meals}>
                {plan.meals_example.map((meal, i) => (
                  <Card key={i} style={[styles.mealCard, { borderLeftColor: pal.accent }]}>
                    <Card.Content>
                      <View style={styles.mealHeader}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={pal.accent} />
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
                            const c = getTagColor(tag);
                            return (
                              <Chip
                                key={t}
                                style={[styles.mealTag, { backgroundColor: c + "22" }]}
                                textStyle={[styles.mealTagText, { color: c }]}
                              >
                                {tag}
                              </Chip>
                            );
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
  );
};

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
  exChipText: { color: emiBlue, fontSize: 12, fontWeight: "500", height: 20 },

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

  cardDescription: { color: "#6c757d", marginBottom: 16 },

  // Grid estable para "Totales del Día"
  overviewGridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  overviewItemBox: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
});

export default PlanDetailScreen;
