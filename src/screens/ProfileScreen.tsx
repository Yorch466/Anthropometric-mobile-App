// src/screens/ProfileScreen.tsx
"use client"

import React from "react"
import { View, StyleSheet, Image } from "react-native"
import { Text, Card, Button, IconButton, Divider } from "react-native-paper"
import BottomActionBar from "@/components/BottomActivationBar" // 👈 nombre correcto del componente
import { emiTheme, emiColors } from "@/theme/emitheme"
import { handleLogout } from "@/hooks/auth"
import { auth } from "@/lib/firebase"

export default function ProfileScreen() {
  const user = auth.currentUser
  const displayName = user?.displayName || "Usuario"
  const email = user?.email || "—"
  const photoURL = user?.photoURL

  const onLogout = async () => {
    try {
      await handleLogout()
    } catch (e) {
      console.log("logout error", e)
    }
  }

  return (
    <View style={styles.root}>
      <View style={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <Text variant="headlineSmall" style={styles.title}>Perfil</Text>
          <IconButton icon="cog-outline" onPress={() => {}} iconColor={emiColors.emiBlue} />
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>
                  {displayName?.[0]?.toUpperCase() ?? "U"}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>
          </Card.Content>

          <Divider />

          <Card.Content style={{ gap: 8, marginTop: 8 }}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>UID</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {user?.uid ?? "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Verificado</Text>
              <Text style={styles.rowValue}>
                {user?.emailVerified ? "Sí" : "No"}
              </Text>
            </View>
          </Card.Content>

          <Card.Actions style={styles.actions}>
            <Button
              mode="contained"
              buttonColor={emiColors.emiBlue}
              onPress={onLogout}
              icon="logout"
            >
              Cerrar sesión
            </Button>
          </Card.Actions>
        </Card>
      </View>

      <BottomActionBar />
    </View>
  )
}

const AVATAR_SIZE = 64

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: emiTheme.colors.background,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: emiTheme.colors.primary,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 8,
  },
  avatarFallback: {
    backgroundColor: emiTheme.colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    color: emiTheme.colors.primary,
    fontWeight: "800",
    fontSize: 22,
  },
  name: {
    color: emiTheme.colors.onSurface,
    fontWeight: "700",
  },
  email: {
    color: emiColors.muted,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    color: emiColors.muted,
  },
  rowValue: {
    color: emiTheme.colors.onSurface,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },
})
