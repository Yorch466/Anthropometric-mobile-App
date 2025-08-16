"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { Button, Card, Text } from "react-native-paper"
import { ensureAnonSignIn } from "../lib/firebase"

interface AuthScreenProps {
  onAuthSuccess: () => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)
    try {
      await ensureAnonSignIn()
      onAuthSuccess()
    } catch (error) {
      console.error("Authentication failed:", error)
      Alert.alert("Error", "No se pudo iniciar sesión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineMedium" style={styles.title}>
              Fitness Tracker
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Analiza tu progreso físico con inteligencia artificial
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Sube una foto, completa tus datos y obtén un plan personalizado de entrenamiento y nutrición.
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={loading}
              disabled={loading}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Iniciando..." : "Continuar"}
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    elevation: 4,
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#4a90e2",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  description: {
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    padding: 24,
    paddingTop: 0,
  },
  continueButton: {
    borderRadius: 12,
    backgroundColor: "#4a90e2",
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
