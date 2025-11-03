// src/screens/PlanDetailPanelScreen.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import PlanDetailPanel from "@/screens/PlanDetailPanel";
import { getPlan } from "@/lib/firestore";
import { normalizePlan, type PlanUI } from "@/lib/plan-ui";
import { logDeep } from "@/utils/log";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = NativeStackScreenProps<RootStackParamList, "PlanDetailPanel">;

export default function PlanDetailPanelScreen({ route }: Props) {
  const { planId, class_idx } = route.params as any; // class_idx opcional
  const [plan, setPlan] = useState<PlanUI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await getPlan(planId);           // <- doc crudo ({ plan: {...} })
        logDeep("[Panel] RAW plan", raw);
        const ui = normalizePlan(raw);               // <- normaliza con el módulo compartido
        logDeep("[Panel] RAW plan", ui);
        console.log("[Panel] meals_example:", ui.meals_example?.length);
        if (mounted) setPlan(ui);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [planId]);

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
        <Text>Cargando plan…</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding: 16 }}>
        <Text>Plan no encontrado.</Text>
      </View>
    );
  }

  return (
    <PlanDetailPanel
      plan={plan}                // <- ya es PlanUI
      planId={String(planId)}
      classIdx={class_idx}
      title="Rutinas por día"
    />
  );
}
