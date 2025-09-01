// src/screens/EMIAuthScreen.tsx
"use client"

import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Card, Text, TextInput, Button, HelperText, Divider } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "@/navigation/AppNavigator"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { handleLogin, handleSignup } from "@/hooks/auth"

type Nav = NativeStackNavigationProp<RootStackParamList, "Dashboard">

const AZUL_EMI = "#0052a5"
const AMARILLO_EMI = "#e9b400"
const BLANCO = "#FFFFFF"

export default function EMIAuthScreen() {
  const navigation = useNavigation<Nav>()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const passwordTooShort = password.length > 0 && password.length < 6

  const onSubmit = async () => {
    setErr("")
    if (!email.trim()) {
      setErr("Ingresa tu correo.")
      return
    }
    if (!password.trim()) {
      setErr("Ingresa tu contraseña.")
      return
    }
    if (password.length < 6) {
      setErr("La contraseña es muy corta (mínimo 6 caracteres).")
      return
    }
    if (!isLogin && !name.trim()) {
      setErr("Ingresa tu nombre.")
      return
    }

    try {
      setLoading(true)
      if (isLogin) {
        await handleLogin(email, password)
      } else {
        await handleSignup(email, password, name)
      }
      navigation.replace("Dashboard")
    } catch (e: any) {
      setErr(e?.message || "Ocurrió un error. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: AZUL_EMI }]}>
      <View style={styles.centerBox}>
        {/* Título */}
        <View style={styles.titleBox}>
          <Text variant="headlineMedium" style={styles.titleWhite}>
            Bienvenido a
          </Text>
          <Text variant="displaySmall" style={[styles.titleGold, { color: AMARILLO_EMI }]}>
            EMI Fitness
          </Text>
        </View>

        {/* Card de Auth */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Toggle Login / Registro */}
            <View style={styles.toggle}>
              <Button
                mode={isLogin ? "contained" : "text"}
                onPress={() => setIsLogin(true)}
                buttonColor={isLogin ? AZUL_EMI : undefined}
                textColor={isLogin ? BLANCO : "#444"}
                style={styles.toggleBtn}
              >
                Iniciar Sesión
              </Button>
              <Button
                mode={!isLogin ? "contained" : "text"}
                onPress={() => setIsLogin(false)}
                buttonColor={!isLogin ? AZUL_EMI : undefined}
                textColor={!isLogin ? BLANCO : "#444"}
                style={styles.toggleBtn}
              >
                Registrarse
              </Button>
            </View>

            {/* Nombre (solo registro) */}
            {!isLogin && (
              <TextInput
                label="Nombre completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                mode="outlined"
                style={styles.input}
              />
            )}

            {/* Email */}
            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />

            {/* Password con ver/ocultar */}
            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  )}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
            />
            <HelperText type={passwordTooShort ? "error" : "info"} visible>
              {passwordTooShort ? "La contraseña mínima es de 6 caracteres." : "Autenticación con email/contraseña"}
            </HelperText>

            {err ? (
              <HelperText type="error" visible style={{ marginTop: -6, marginBottom: 6 }}>
                {err}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={loading}
              style={[styles.submit, { backgroundColor: AMARILLO_EMI }]}
              contentStyle={{ paddingVertical: 6 }}
            >
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </Button>

            {isLogin && (
              <>
                <Divider style={{ marginVertical: 12 }} />
                <Button
                  onPress={() => {
                    // aquí podrías llevar a una pantalla de "ForgotPassword"
                  }}
                  textColor={AZUL_EMI}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  centerBox: { width: "100%", maxWidth: 420 },
  titleBox: { alignItems: "center", marginBottom: 16 },
  titleWhite: { color: BLANCO, fontWeight: "700" },
  titleGold: { fontWeight: "800" },

  card: { borderRadius: 16, overflow: "hidden" },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: { flex: 1 },

  input: { marginTop: 8, backgroundColor: BLANCO },
  submit: { marginTop: 6, borderRadius: 10 },
})
