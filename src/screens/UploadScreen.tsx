// src/screens/UploadScreen.tsx
"use client"

import React, { useState } from "react"
import { View, StyleSheet, ScrollView, Image, Alert } from "react-native"
import { Card, Text, Button, TextInput, Switch, Checkbox, ActivityIndicator } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { callProcessMultipart } from "@/lib/api"
import type { Goals, Constraints } from "@/types"
import { getCurrentUserId } from "@/hooks/auth"
import { PROCESS_URL, PROCESS_PATH } from "@/config/env"
import BottomActionBar from "@/components/BottomActivationBar" // <-- si tu archivo es BottomActivationBar, cambia esto

type UploadNavigationProp = NativeStackNavigationProp<any, "Upload">

// Colores EMI
const emiBlue = "#0052a5"
const emiGold = "#e9b400"
const bg = "#f8f9fa"
const muted = "#666"

export const UploadScreen: React.FC = () => {
  const navigation = useNavigation<UploadNavigationProp>()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [sex, setSex] = useState<number>(0) // 0=female, 1=male
  const [goals, setGoals] = useState<Goals>({ run_s: 0, push: 0, sit: 0 })
  const [constraints, setConstraints] = useState<Constraints>({
    vegan: false,
    lactose_free: false,
    gluten_free: false,
    inj_knee: false,
    inj_shoulder: false,
    inj_back: false,
  })
  const [processing, setProcessing] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permisos", "Necesitamos acceso a tu galería para seleccionar una imagen.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    })
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Por favor selecciona una imagen.")
      return
    }
    if (goals.run_s <= 0 || goals.push <= 0 || goals.sit <= 0) {
      Alert.alert("Error", "Por favor completa todas las metas.")
      return
    }

    const userId = getCurrentUserId()
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }

    setProcessing(true)
    try {
      // Llamada MULTIPART a tu backend (archivo + campos)
      const resp = await callProcessMultipart({
        fileUri: selectedImage,
        sex,
        goal_3200_s: goals.run_s,
        goal_push: goals.push,
        goal_sit: goals.sit,
        user_id: userId,
        // flags opcionales como 0/1
        knee: constraints.inj_knee ? 1 : 0,
        shoulder: constraints.inj_shoulder ? 1 : 0,
        back: constraints.inj_back ? 1 : 0,
        vegan: constraints.vegan ? 1 : 0,
        lactose_free: constraints.lactose_free ? 1 : 0,
        gluten_free: constraints.gluten_free ? 1 : 0,
        baseUrl: PROCESS_URL,
        processPath: PROCESS_PATH,   // ← aquí se decide '/process' o '/api/process'
        fileFieldName: 'file',
      })

      console.log("RESP /process:", resp)

      // Si el backend devuelve IDs, navegamos y reflejamos en la subcolección del usuario
      if (resp?.uploadId && resp?.predId && resp?.planId) {
        // Espejo en users/{uid}/uploads/{uploadId} como 'planned'
        try {
          const userDoc = doc(db, "users", userId, "uploads", String(resp.uploadId))
          await setDoc(
            userDoc,
            {
              image_path: "", // si luego guardas downloadURL, cámbialo aquí
              sex,
              goals,
              constraints,
              status: "planned",
              predId: String(resp.predId),
              planId: String(resp.planId),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          )
        } catch (e) {
          console.warn("No se pudo reflejar el upload en users/{uid}/uploads:", e)
        }

        navigation.replace("Results", {
          uploadId: String(resp.uploadId),
          predId: String(resp.predId),
          planId: String(resp.planId),
        })
        return
      }

      Alert.alert("Atención", "El backend respondió sin IDs. Revisa el log.")
      setProcessing(false)
    } catch (e: any) {
      console.error("Upload failed:", e)
      Alert.alert("Error", e?.message ?? "No se pudo procesar la imagen.")
      setProcessing(false)
    }
  }

  const updateGoal = (key: keyof Goals, value: string) => {
    const numValue = Number.parseInt(value) || 0
    setGoals((prev) => ({ ...prev, [key]: numValue }))
  }
  const updateConstraint = (key: keyof Constraints, value: boolean) => {
    setConstraints((prev) => ({ ...prev, [key]: value }))
  }

  if (processing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={emiBlue} />
        <Text variant="headlineSmall" style={styles.processingTitle}>Procesando...</Text>
        <Text variant="bodyLarge" style={styles.processingSubtitle}>
          Analizando tu imagen y generando tu plan personalizado
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instrucciones para la foto */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.instructionsTitle}>📸 Instrucciones para la foto</Text>
            <Text variant="bodyMedium" style={styles.instructionsSubtitle}>
              Sigue estas indicaciones para mejores resultados
            </Text>

            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.iconContainer}><Ionicons name="resize-outline" size={24} color={emiBlue} /></View>
                <View style={styles.instructionText}>
                  <Text variant="bodyLarge" style={styles.instructionTitle}>Distancia: 2 metros</Text>
                  <Text variant="bodyMedium" style={styles.instructionDescription}>
                    Colócate a 2 metros para capturar todo tu cuerpo.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.iconContainer}><Ionicons name="eye-outline" size={24} color={emiBlue} /></View>
                <View style={styles.instructionText}>
                  <Text variant="bodyLarge" style={styles.instructionTitle}>Altura de los ojos</Text>
                  <Text variant="bodyMedium" style={styles.instructionDescription}>
                    La cámara debe estar a la altura de tus ojos.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.iconContainer}><Ionicons name="sunny-outline" size={24} color={emiBlue} /></View>
                <View style={styles.instructionText}>
                  <Text variant="bodyLarge" style={styles.instructionTitle}>Buena iluminación</Text>
                  <Text variant="bodyMedium" style={styles.instructionDescription}>
                    Usa luz uniforme; evita sombras fuertes.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.iconContainer}><Ionicons name="shirt-outline" size={24} color={emiBlue} /></View>
                <View style={styles.instructionText}>
                  <Text variant="bodyLarge" style={styles.instructionTitle}>Ropa ajustada</Text>
                  <Text variant="bodyMedium" style={styles.instructionDescription}>
                    Ropa deportiva ajustada para perfilar tu silueta.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.iconContainer}><Ionicons name="person-outline" size={24} color={emiBlue} /></View>
                <View style={styles.instructionText}>
                  <Text variant="bodyLarge" style={styles.instructionTitle}>Postura natural</Text>
                  <Text variant="bodyMedium" style={styles.instructionDescription}>
                    De pie, erguido y brazos a los costados.
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Imagen */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Foto Corporal</Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              Sube una foto de cuerpo completo siguiendo las instrucciones anteriores.
            </Text>
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <Button mode="outlined" onPress={pickImage} style={styles.changeImageButton} textColor={emiBlue}>
                  Cambiar Imagen
                </Button>
              </View>
            ) : (
              <Button mode="contained" onPress={pickImage} style={styles.selectImageButton}>
                Seleccionar Imagen
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Datos personales */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Datos Personales</Text>
            <View style={styles.sexToggle}>
              <Text variant="bodyLarge" style={styles.fieldLabel}>Sexo</Text>
              <View style={styles.toggleContainer}>
                <Text variant="bodyMedium" style={[styles.toggleLabel, sex === 0 && styles.activeToggleLabel]}>
                  Femenino
                </Text>
                <Switch value={sex === 1} onValueChange={(v) => setSex(v ? 1 : 0)} />
                <Text variant="bodyMedium" style={[styles.toggleLabel, sex === 1 && styles.activeToggleLabel]}>
                  Masculino
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Metas */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Metas de Rendimiento</Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>Ingresa tus objetivos actuales</Text>
            <View style={styles.goalsContainer}>
              <TextInput
                label="Tiempo 3200m (segundos)"
                value={String(goals.run_s)}
                onChangeText={(v) => updateGoal("run_s", v)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.goalInput}
              />
              <TextInput
                label="Flexiones (cantidad)"
                value={String(goals.push)}
                onChangeText={(v) => updateGoal("push", v)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.goalInput}
              />
              <TextInput
                label="Abdominales (cantidad)"
                value={String(goals.sit)}
                onChangeText={(v) => updateGoal("sit", v)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.goalInput}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Restricciones */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Restricciones</Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>Selecciona las restricciones que apliquen</Text>
            <View style={styles.constraintsContainer}>
              <Text variant="titleMedium" style={styles.constraintCategory}>Alimentarias</Text>
              <View style={styles.checkboxRow}>
                <Checkbox status={constraints.vegan ? "checked" : "unchecked"} onPress={() => updateConstraint("vegan", !constraints.vegan)} />
                <Text variant="bodyLarge" style={styles.checkboxLabel}>Vegano</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox status={constraints.lactose_free ? "checked" : "unchecked"} onPress={() => updateConstraint("lactose_free", !constraints.lactose_free)} />
                <Text variant="bodyLarge" style={styles.checkboxLabel}>Sin Lactosa</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox status={constraints.gluten_free ? "checked" : "unchecked"} onPress={() => updateConstraint("gluten_free", !constraints.gluten_free)} />
                <Text variant="bodyLarge" style={styles.checkboxLabel}>Sin Gluten</Text>
              </View>

              <Text variant="titleMedium" style={[styles.constraintCategory, styles.injuryCategory]}>Lesiones</Text>
              <View style={styles.checkboxRow}>
                <Checkbox status={constraints.inj_knee ? "checked" : "unchecked"} onPress={() => updateConstraint("inj_knee", !constraints.inj_knee)} />
                <Text variant="bodyLarge" style={styles.checkboxLabel}>Lesión de Rodilla</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox status={constraints.inj_shoulder ? "checked" : "unchecked"} onPress={() => updateConstraint("inj_shoulder", !constraints.inj_shoulder)} />
                <Text variant="bodyLarge" style={styles.checkboxLabel}>Lesión de Hombro</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox status={constraints.inj_back ? "checked" : "unchecked"} onPress={() => updateConstraint("inj_back", !constraints.inj_back)} />
                <Text variant="bodyLarge" style={styles.checkboxLabel}>Lesión de Espalda</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          disabled={!selectedImage || processing}
        >
          Analizar Imagen
        </Button>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* barra inferior EMI */}
      <BottomActionBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bg },
  container: { flex: 1 },
  content: { padding: 20 },

  instructionsCard: {
    marginBottom: 24,
    elevation: 3,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: emiGold,
  },
  instructionsTitle: { fontWeight: "700", color: emiBlue, marginBottom: 8, fontSize: 20 },
  instructionsSubtitle: { color: muted, marginBottom: 20, fontSize: 14 },
  instructionsList: { gap: 16 },
  instructionItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#e9b40015",
    justifyContent: "center", alignItems: "center", marginTop: 2,
  },
  instructionText: { flex: 1 },
  instructionTitle: { fontWeight: "600", color: emiBlue, marginBottom: 4 },
  instructionDescription: { color: muted, lineHeight: 20 },

  card: { marginBottom: 20, elevation: 2, borderRadius: 16, backgroundColor: "#ffffff" },
  sectionTitle: { fontWeight: "600", color: emiBlue, marginBottom: 8 },
  sectionDescription: { color: muted, marginBottom: 16 },

  imageContainer: { alignItems: "center" },
  selectedImage: { width: 200, height: 267, borderRadius: 12, marginBottom: 16, borderWidth: 2, borderColor: emiGold },
  changeImageButton: { borderRadius: 8, borderColor: emiGold },
  selectImageButton: { borderRadius: 12, backgroundColor: emiGold },

  sexToggle: { marginTop: 8 },
  fieldLabel: { fontWeight: "500", color: emiBlue, marginBottom: 12 },
  toggleContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  toggleLabel: { color: muted },
  activeToggleLabel: { color: emiBlue, fontWeight: "600" },

  goalsContainer: { gap: 16 },
  goalInput: { backgroundColor: "#fff" },

  constraintsContainer: { gap: 8 },
  constraintCategory: { fontWeight: "600", color: emiBlue, marginTop: 8, marginBottom: 8 },
  injuryCategory: { marginTop: 16 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  checkboxLabel: { marginLeft: 8, color: "#1a1a1a" },

  submitButton: { borderRadius: 12, backgroundColor: emiGold, marginTop: 8, marginBottom: 32, elevation: 3 },
  submitButtonContent: { paddingVertical: 12 },

  processingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg, padding: 20 },
  processingTitle: { fontWeight: "600", color: emiBlue, marginTop: 24, marginBottom: 8 },
  processingSubtitle: { color: muted, textAlign: "center" },
})
