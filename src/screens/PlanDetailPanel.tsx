// src/screens/PlanDetailPanel.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Chip, Button, List } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Firebase (usa la app por defecto inicializada en tu proyecto)
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Tipos compartidos de la UI del plan (¡ya normalizado!)
import type { PlanUI, TrainingDay, Session, Meal } from "@/lib/plan-ui";

type Props = {
  plan: PlanUI;       // <- YA normalizado por el wrapper
  planId: string;
  classIdx?: number;
  title?: string;
};

/** ===== Paleta y colores base ===== */
const emiBlue = "#0052a5";
const emiGold = "#e9b400";
const bg = "#f8f9fa";
const muted = "#666";

const MORPHO = {
  red:   { accent: "#ef4444", bg: "#fee2e2", chipBg: "#fee2e2", chipText: "#991b1b" },   // 0 y 4
  yel:   { accent: "#f59e0b", bg: "#fef3c7", chipBg: "#fff7ed", chipText: "#92400e" },   // 1 y 3
  green: { accent: "#10b981", bg: "#dcfce7", chipBg: "#ecfdf5", chipText: "#065f46" },   // 2
} as const;

const paletteFor = (idx?: number) => {
  switch (idx) {
    case 0: return MORPHO.red;
    case 1: return MORPHO.yel;
    case 2: return MORPHO.green;
    case 3: return MORPHO.yel;
    case 4: return MORPHO.red;
    default: return { accent: emiBlue, bg: "#e7f1ff", chipBg: "#e3f2fd", chipText: emiBlue };
  }
};

/** ===== Helpers ===== */
const getDayName = (day: number | string): string => {
  if (typeof day === "string") return day;
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  return days[day - 1] || `Día ${day}`;
};

const getSessionIcon = (type?: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch ((type || "").toLowerCase()) {
    case "run": return "run";
    case "strength": return "dumbbell";
    case "core": return "meditation";
    default: return "arm-flex-outline";
  }
};

const getSessionLine = (s: Session): string => {
  const t = (s?.type || "").toLowerCase();
  const mins = (s as any).minutes ?? (s as any).duration_min;
  const km = (s as any).distance_km;
  const sets = (s as any).sets ?? (s as any).reps ?? (s as any).pushups_sets ?? (s as any).situps_sets;
  const pieces: string[] = [];
  if (t) pieces.push(t.charAt(0).toUpperCase() + t.slice(1));
  if (mins) pieces.push(`${mins} min`);
  if (km) pieces.push(`${km} km`);
  if (sets) pieces.push(`${sets} sets`);
  return pieces.join(" • ");
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

/** ===== Componente ===== */
const PlanDetailPanel: React.FC<Props> = ({ plan, planId, classIdx, title = "Rutinas por día" }) => {
  const pal = paletteFor(classIdx);

  // mapa de progreso por día: { "1": true, "2": false, ... }
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  // Suscribirse a progreso en Firestore
  useEffect(() => {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid || !planId) return;

    const db = getFirestore();
    const colRef = collection(db, "users", uid, "plans", String(planId), "progress");
    const unsub = onSnapshot(colRef, (snap) => {
      const map: Record<string, boolean> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        map[d.id] = !!data.completed;
      });
      setProgress(map);
    });
    return unsub;
  }, [planId]);

  // toggle “completado” por día
  const toggleDay = useCallback(async (day: number | string) => {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid || !planId) return;

    const db = getFirestore();
    const key = String(day);
    const done = !progress[key];

    const ref = doc(db, "users", uid, "plans", String(planId), "progress", key);
    await setDoc(
      ref,
      { completed: done, completedAt: done ? serverTimestamp() : null },
      { merge: true }
    );
  }, [planId, progress]);

  // Calcula minutos totales por día
  const getTotalMinutes = (d: TrainingDay) =>
    (d.sessions || []).reduce((acc, s) => acc + ((s as any).minutes ?? (s as any).duration_min ?? 0), 0);

  return (
    <View>
      {/* Cabecera del panel */}
      <Card style={[styles.card, { borderLeftColor: pal.accent, shadowColor: pal.accent }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-check" size={22} color={pal.accent} />
            <Text variant="headlineSmall" style={styles.cardTitle}>{title}</Text>
          </View>
          <Text variant="bodyMedium" style={styles.cardDescription}>
            Marca los días realizados y consulta la dieta del día.
          </Text>
        </Card.Content>
      </Card>

      {/* Lista por día con acordeones de Rutina y Dieta */}
      {plan.training.map((day, idx) => {
        const key = String((day as any).day ?? idx + 1);
        const done = !!progress[key];
        const totalMin = getTotalMinutes(day);

        return (
          <Card key={key} style={[styles.dayCard, { borderLeftColor: done ? pal.accent : emiGold }]}>
            <Card.Content>
              <View style={styles.dayHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name={done ? "checkbox-marked-circle-outline" : "checkbox-blank-circle-outline"}
                    size={20}
                    color={done ? pal.accent : "#999"}
                  />
                  <Text variant="titleLarge" style={[styles.dayTitle, { marginLeft: 8 }]}>
                    {getDayName((day as any).day)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="timer-outline" size={18} color={pal.accent} />
                  <Text variant="bodyMedium" style={[styles.totalMin, { color: pal.accent }]}>
                    {totalMin} min
                  </Text>
                  <Button
                    mode={done ? "contained-tonal" : "outlined"}
                    onPress={() => toggleDay((day as any).day)}
                    style={{ marginLeft: 12 }}
                    textColor={done ? pal.chipText : pal.accent}
                  >
                    {done ? "Realizado" : "Marcar realizado"}
                  </Button>
                </View>
              </View>

              {/* Acordeones: Rutina y Dieta */}
              <List.AccordionGroup>
                <List.Accordion
                  id={`rutina-${key}`}
                  title="Rutina"
                  left={(props) => <List.Icon {...props} color={pal.accent} icon="run" />}
                  titleStyle={{ fontWeight: "700", color: pal.accent }}
                  style={{ backgroundColor: pal.bg, borderRadius: 12, marginBottom: 10 }}
                >
                  {(day.sessions ?? []).length > 0 ? (
                    <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
                      {day.sessions.map((s, i) => (
                        <View key={i} style={[styles.sessionRow, { borderLeftColor: pal.accent }]}>
                          <MaterialCommunityIcons name={getSessionIcon((s as any).type)} size={18} color={pal.accent} />
                          <Text variant="bodyMedium" style={styles.sessionText}>{getSessionLine(s)}</Text>
                        </View>
                      ))}
                      {/* Ejercicios listados */}
                      {day.sessions.some((s) => ((s as any).exercises || []).length) && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          {day.sessions.flatMap((s) => ((s as any).exercises || [])).map((ex, j) => (
                            <Chip key={j} style={[styles.exChip, { borderColor: pal.accent }]} textStyle={{ color: pal.accent }}>
                              {ex}
                            </Chip>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.restRow}>
                      <MaterialCommunityIcons name="sleep" size={18} color="#999" />
                      <Text variant="bodyMedium" style={styles.restText}>Día de descanso</Text>
                    </View>
                  )}
                </List.Accordion>

                <List.Accordion
                  id={`dieta-${key}`}
                  title="Dieta del día"
                  left={(props) => <List.Icon {...props} color={pal.accent} icon="food-apple" />}
                  titleStyle={{ fontWeight: "700", color: pal.accent }}
                  style={{ backgroundColor: pal.bg, borderRadius: 12 }}
                >
                  {Array.isArray(plan.meals_example) && plan.meals_example.length > 0 ? (
                    <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
                      {plan.meals_example.map((meal: Meal, i: number) => (
                        <Card key={`${key}-meal-${i}`} style={[styles.mealCard, { borderLeftColor: pal.accent }]}>
                          <Card.Content>
                            <View style={styles.mealHeader}>
                              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={pal.accent} />
                              <Text variant="titleMedium" style={styles.mealTitle}>{meal.title}</Text>
                            </View>
                            <Text variant="bodySmall" style={styles.mealNutritionText}>
                              <Text style={styles.nutritionHighlight}>{meal.kcal} kcal</Text>
                              {"  •  "}{meal.protein_g}g proteína
                              {"  •  "}{meal.fat_g}g grasa
                              {"  •  "}{meal.carbs_g}g carbos
                            </Text>

                            {!!meal.tags?.length && (
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                                {meal.tags.map((tag, t) => {
                                  const c = getTagColor(tag);
                                  return (
                                    <Chip
                                      key={t}
                                      style={{ backgroundColor: c + "22", height: 26 }}
                                      textStyle={{ color: c, fontWeight: "600" }}
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
                  ) : (
                    <View style={styles.restRow}>
                      <MaterialCommunityIcons name="food-off" size={18} color="#999" />
                      <Text variant="bodyMedium" style={styles.restText}>Sin sugerencias de dieta</Text>
                    </View>
                  )}
                </List.Accordion>
              </List.AccordionGroup>
            </Card.Content>
          </Card>
        );
      })}
    </View>
  );
};

export default PlanDetailPanel;

/** ====== estilos ====== */
const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    elevation: 3,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: emiBlue,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontWeight: "700", color: emiBlue, marginLeft: 8 },
  cardDescription: { color: "#6c757d" },

  dayCard: {
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: emiGold,
    marginBottom: 14,
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayTitle: { fontWeight: "700", color: emiBlue },
  totalMin: { marginLeft: 6, fontWeight: "700" },

  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: bg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: emiBlue,
    marginBottom: 6,
  },
  sessionText: { color: muted },

  exChip: { backgroundColor: "#e3f2fd", borderWidth: 1, height: 26 },

  restRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 8 },
  restText: { color: "#999", fontStyle: "italic" },

  mealCard: { elevation: 1, borderRadius: 12, backgroundColor: "#FFFFFF", borderLeftWidth: 3, borderLeftColor: emiGold, marginBottom: 10 },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  mealTitle: { fontWeight: "700", color: emiBlue, marginLeft: 8 },
  mealNutritionText: { color: muted },
  nutritionHighlight: { color: emiGold, fontWeight: "700" },
});
