// src/screens/AuthScreen.tsx
import React, { useMemo, useState } from "react"
import { View, KeyboardAvoidingView, Platform } from "react-native"
import { TextInput, Button, Text, Card, HelperText, Divider } from "react-native-paper"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { upsertUserProfile } from "@/lib/userProfile"
import { handleSignup, handleLogin } from "@/hooks/auth"


type Mode = "login" | "signup"

export default function AuthScreen({ navigation }: any) {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isSignup = mode === "signup"

  // Validaciones mínimas
  const isValidEmail = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email])
  const isValidPassword = useMemo(() => password.length >= 6, [password])
  const isValidName = useMemo(() => (isSignup ? name.trim().length >= 2 : true), [name, isSignup])

  const canSubmit = isValidEmail && isValidPassword && isValidName && !loading

  const toFriendlyError = (code: string) => {
    switch (code) {
      case "auth/invalid-email":
        return "Correo inválido."
      case "auth/missing-password":
        return "Ingresa tu contraseña."
      case "auth/weak-password":
        return "La contraseña es muy corta (mínimo 6 caracteres)."
      case "auth/email-already-in-use":
        return "Este correo ya está registrado."
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Credenciales incorrectas."
      case "auth/user-not-found":
        return "No existe una cuenta con ese correo."
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta más tarde."
      default:
        return "Ocurrió un error. Inténtalo de nuevo."
    }
  }

  const onSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setErrorMsg(null)

    try {
      if (isSignup) {
        await handleSignup(email, password, name)
      } else {
        await handleLogin(email, password)
      }
      navigation.replace("Home")

    } catch (e: any) {
      setErrorMsg(e?.message ?? "Error al autenticar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          backgroundColor: "#f5f5f5",
        }}
      >
        <Card
          mode="elevated"
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 420,
            borderRadius: 16,
          }}
        >
          <Card.Content style={{ paddingTop: 8 }}>
            <Text variant="headlineMedium" style={{ marginBottom: 8, textAlign: "center" }}>
              {isSignup ? "Crear cuenta" : "Iniciar sesión"}
            </Text>

            {isSignup && (
              <>
                <TextInput
                  label="Nombre"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  mode="outlined"
                  style={{ marginBottom: 8 }}
                />
                <HelperText type={isValidName ? "info" : "error"} visible={!isValidName}>
                  Ingresa al menos 2 caracteres.
                </HelperText>
              </>
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <HelperText type={isValidEmail ? "info" : "error"} visible={!isValidEmail}>
              Ingresa un correo válido.
            </HelperText>

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              mode="outlined"
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
              style={{ marginBottom: 8 }}
            />
            <HelperText type={isValidPassword ? "info" : "error"} visible={!isValidPassword}>
              Mínimo 6 caracteres (requisito de Firebase).
            </HelperText>

            {errorMsg && (
              <HelperText type="error" visible style={{ marginBottom: 4 }}>
                {errorMsg}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={loading}
              disabled={!canSubmit}
              style={{ marginTop: 8, borderRadius: 10 }}
              contentStyle={{ paddingVertical: 8 }}
            >
              {isSignup ? "Registrarme" : "Entrar"}
            </Button>

            <Divider style={{ marginVertical: 12 }} />

            <Button
              onPress={() => setMode(isSignup ? "login" : "signup")}
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {isSignup ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  )
}
