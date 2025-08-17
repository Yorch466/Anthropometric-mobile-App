// src/screens/UploadScreen.tsx
"use client"

import React, { useState } from "react"
import { View, StyleSheet, ScrollView, Image, Alert } from "react-native"
import { Card, Text, Button, TextInput, Switch, Checkbox, ActivityIndicator } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { storage, db } from "@/lib/firebase"
import { callProcessMultipart } from "@/lib/api"
import type { Goals, Constraints } from "@/types"
import { getCurrentUserId } from "@/hooks/auth"
import { PROCESS_URL } from "@/config/env"

// Si tienes RootStackParamList bien tipado, reemplaza "any" por tu tipo:
// type UploadNavigationProp = NativeStackNavigationProp<RootStackParamList, "Upload">
type UploadNavigationProp = any

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ (no MediaTypeOptions)
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    // ...validaciones previas
    const userId = getCurrentUserId()
    if (!userId) { Alert.alert("Error", "Usuario no autenticado."); return }

    setProcessing(true)
    try {
      const resp = await callProcessMultipart({
        fileUri: selectedImage!, // ya validado arriba
        sex,
        goal_3200_s: goals.run_s,
        goal_push: goals.push,
        goal_sit: goals.sit,
        user_id: userId,
        knee: constraints.inj_knee ? 1 : 0,
        shoulder: constraints.inj_shoulder ? 1 : 0,
        back: constraints.inj_back ? 1 : 0,
        vegan: constraints.vegan ? 1 : 0,
        lactose_free: constraints.lactose_free ? 1 : 0,
        gluten_free: constraints.gluten_free ? 1 : 0,
        baseUrl: PROCESS_URL,
      })

      // LOG para ver qué llega
      console.log("RESP /process:", resp)

      if (resp?.uploadId && resp?.predId && resp?.planId) {
        navigation.replace("Results", {
          uploadId: String(resp.uploadId),
          predId: String(resp.predId),
          planId: String(resp.planId),
        })
        return
      }

      if (resp?.uploadId && resp?.predId && resp?.planId) {
  // 👇 ESCRIBE/REFLEJA EN LA SUBCOLECCIÓN DEL USUARIO
    const userDoc = doc(db, "users", userId, "uploads", String(resp.uploadId))
    await setDoc(
    userDoc,
    {
      image_path: "",                         // si luego guardas downloadURL, cámbialo aquí
      sex,
      goals,
      constraints,
      status: "planned",                      // 🔸 usa "planned" para alinear con tu History actual
      predId: String(resp.predId),
      planId: String(resp.planId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  // ahora sí navega
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
        <ActivityIndicator size="large" />
        <Text variant="headlineSmall" style={styles.processingTitle}>
          Procesando...
        </Text>
        <Text variant="bodyLarge" style={styles.processingSubtitle}>
          Analizando tu imagen y generando tu plan personalizado
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Imagen */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Foto Corporal</Text>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              Sube una foto de cuerpo completo para obtener medidas precisas
            </Text>
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <Button mode="outlined" onPress={pickImage} style={styles.changeImageButton}>
                  Cambiar Imagen
                </Button>
              </View>
            ) : (
              <Button mode="contained" onPress={pickImage} style={styles.selectImageButton} icon="camera-plus">
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
                value={goals.run_s.toString()}
                onChangeText={(v) => updateGoal("run_s", v)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.goalInput}
              />
              <TextInput
                label="Flexiones (cantidad)"
                value={goals.push.toString()}
                onChangeText={(v) => updateGoal("push", v)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.goalInput}
              />
              <TextInput
                label="Abdominales (cantidad)"
                value={goals.sit.toString()}
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
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 20 },
  card: { marginBottom: 20, elevation: 2, borderRadius: 16 },
  sectionTitle: { fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  sectionDescription: { color: "#666", marginBottom: 16 },
  imageContainer: { alignItems: "center" },
  selectedImage: { width: 200, height: 267, borderRadius: 12, marginBottom: 16 },
  changeImageButton: { borderRadius: 8 },
  selectImageButton: { borderRadius: 12, backgroundColor: "#4a90e2" },
  sexToggle: { marginTop: 8 },
  fieldLabel: { fontWeight: "500", color: "#1a1a1a", marginBottom: 12 },
  toggleContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  toggleLabel: { color: "#666" },
  activeToggleLabel: { color: "#4a90e2", fontWeight: "600" },
  goalsContainer: { gap: 16 },
  goalInput: { backgroundColor: "#fff" },
  constraintsContainer: { gap: 8 },
  constraintCategory: { fontWeight: "600", color: "#1a1a1a", marginTop: 8, marginBottom: 8 },
  injuryCategory: { marginTop: 16 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  checkboxLabel: { marginLeft: 8, color: "#1a1a1a" },
  submitButton: { borderRadius: 12, backgroundColor: "#4a90e2", marginTop: 8, marginBottom: 32 },
  submitButtonContent: { paddingVertical: 8 },
  processingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 20 },
  processingTitle: { fontWeight: "600", color: "#1a1a1a", marginTop: 24, marginBottom: 8 },
  processingSubtitle: { color: "#666", textAlign: "center" },
})
