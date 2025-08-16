// src/screens/AuthScreen.tsx
import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button, Text, Card, HelperText, Divider } from "react-native-paper";
import { signInEmail, signUpEmail } from "@/lib/emailAuth";

export default function AuthScreen({ navigation }: any) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  const onSubmit = async () => {
    setLoading(true);
    try {
      if (isSignup) {
        await signUpEmail(email.trim(), password, name.trim());
      } else {
        await signInEmail(email.trim(), password);
      }
      navigation.replace("Home");
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Card mode="elevated" style={{ padding: 16 }}>
        <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
          {isSignup ? "Crear cuenta" : "Iniciar sesión"}
        </Text>

        {isSignup && (
          <TextInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={{ marginBottom: 8 }}
          />
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 8 }}
        />

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: 8 }}
        />

        <HelperText type="info">Autenticación con email/contraseña</HelperText>

        <Button mode="contained" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }}>
          {isSignup ? "Registrarme" : "Entrar"}
        </Button>

        <Divider style={{ marginVertical: 12 }} />

        <Button onPress={() => setMode(isSignup ? "login" : "signup")} style={{ marginTop: 12 }}>
          {isSignup ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </Button>
      </Card>
    </View>
  );
}
