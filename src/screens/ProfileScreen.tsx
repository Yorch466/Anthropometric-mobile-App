
// src/screens/ProfileScreen.tsx
import { useEffect, useMemo, useState } from "react"
import { View, StyleSheet, Image, ScrollView } from "react-native"
import { Text, Card, Button, IconButton, Divider, TextInput, HelperText, Surface } from "react-native-paper"
import { Picker } from "@react-native-picker/picker"

import BottomActionBar from "@/components/BottomActivationBar"
import { emiColors } from "@/theme/emitheme"
import { handleLogout } from "@/hooks/auth" // o '@/lib/auth'
import { auth } from "@/lib/firebase"
import { getUserProfile, updateUserProfile } from "@/lib/userProfile"
import { RANKS, type RankCategory } from "@/constants/ranks"

export default function ProfileScreen() {
  const user = auth.currentUser
  const uid = user?.uid
  const displayName = user?.displayName || "Usuario"
  const email = user?.email || "—"
  const photoURL = user?.photoURL

  const [age, setAge] = useState<string>("")
  const [rankCat, setRankCat] = useState<RankCategory | "">("")
  const [rank, setRank] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const rankOptions = useMemo(() => (rankCat ? RANKS[rankCat].options : []), [rankCat])

  function validAge() {
    const n = Number(age)
    return Number.isFinite(n) && n >= 16 && n <= 80
  }

  useEffect(() => {
    ;(async () => {
      if (!uid) return
      const p = await getUserProfile(uid)
      if (p?.age != null) setAge(String(p.age))
      if (p?.rankCategory) setRankCat(p.rankCategory as RankCategory)
      if (p?.rank) setRank(p.rank)
    })()
  }, [uid])

  async function onSave() {
    setMsg(null)
    if (!uid) return
    if (!validAge()) return setMsg("Edad inválida (16–80).")
    if (!rankCat || !rank) return setMsg("Selecciona grado.")
    setSaving(true)
    try {
      await updateUserProfile(uid, {
        age: Number(age),
        rankCategory: rankCat,
        rank,
      })
      setMsg("Perfil actualizado.")
    } catch {
      setMsg("No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.root}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Mi Perfil
          </Text>
          <IconButton
            icon="logout"
            iconColor={emiColors.white}
            size={24}
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
      </Surface>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Card style={styles.userCard} elevation={3}>
          <Card.Content style={styles.userCardContent}>
            <View style={styles.userRow}>
              {photoURL ? (
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: photoURL }} style={styles.avatar} />
                </View>
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{displayName?.[0]?.toUpperCase() ?? "U"}</Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text variant="titleLarge" style={styles.name}>
                  {displayName}
                </Text>
                <Text variant="bodyMedium" style={styles.email}>
                  {email}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.formCard} elevation={3}>
          <Card.Content style={styles.formContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Información Personal
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text variant="labelLarge" style={styles.inputLabel}>
                📅 Edad
              </Text>
              <TextInput
                mode="outlined"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="Ej. 25"
                style={styles.textInput}
                outlineColor={emiColors.emiBlue}
                activeOutlineColor={emiColors.emiBlue}
                error={!validAge() && !!age}
              />
              <HelperText type="error" visible={!validAge() && !!age} style={styles.helperText}>
                Debe estar entre 16 y 80 años.
              </HelperText>
            </View>

            <View style={styles.inputGroup}>
              <Text variant="labelLarge" style={styles.inputLabel}>
                🏅 Categoría
              </Text>
              <Surface style={styles.pickerContainer} elevation={1}>
                <Picker
                  selectedValue={rankCat}
                  onValueChange={(v) => {
                    setRankCat(v)
                    setRank("")
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona..." value="" />
                  {Object.entries(RANKS).map(([key, group]) => (
                    <Picker.Item key={key} label={group.label} value={key} />
                  ))}
                </Picker>
              </Surface>
            </View>

            <View style={styles.inputGroup}>
              <Text variant="labelLarge" style={styles.inputLabel}>
                ⭐ Grado
              </Text>
              <Surface style={[styles.pickerContainer, !rankCat && styles.disabledPicker]} elevation={1}>
                <Picker enabled={!!rankCat} selectedValue={rank} onValueChange={setRank} style={styles.picker}>
                  <Picker.Item label={rankCat ? "Selecciona..." : "Elige categoría primero"} value="" />
                  {rankOptions.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </Surface>
            </View>

            {!!msg && (
              <Surface
                style={[
                  styles.messageContainer,
                  msg.includes("actualizado") ? styles.successMessage : styles.errorMessage,
                ]}
                elevation={1}
              >
                <Text style={styles.messageText}>{msg}</Text>
              </Surface>
            )}

            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={onSave}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
                contentStyle={styles.saveButtonContent}
                labelStyle={styles.saveButtonLabel}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <BottomActionBar />
    </View>
  )
}

const AVATAR_SIZE = 80

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: emiColors.emiBlue,
  },
  header: {
    backgroundColor: emiColors.emiBlue,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: emiColors.white,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: emiColors.white,
  },
  userCardContent: {
    padding: 20,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallback: {
    backgroundColor: emiColors.gold,
  },
  avatarText: {
    color: emiColors.text,
    fontWeight: "bold",
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    color: emiColors.text,
    marginBottom: 4,
  },
  email: {
    color: "#666",
    fontSize: 14,
  },
  formCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: emiColors.white,
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    color: emiColors.text,
    fontWeight: "bold",
    textAlign: "center",
  },
  divider: {
    backgroundColor: emiColors.gold,
    height: 2,
    marginVertical: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: emiColors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  textInput: {
    backgroundColor: emiColors.white,
  },
  helperText: {
    marginTop: -4,
  },
  pickerContainer: {
    borderRadius: 12,
    backgroundColor: emiColors.white,
    borderWidth: 1,
    borderColor: emiColors.outline,
    overflow: "hidden",
  },
  disabledPicker: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
  },
  picker: {
    height: 50,
  },
  messageContainer: {
    padding: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  successMessage: {
    backgroundColor: "#e8f5e8",
    borderColor: "#4caf50",
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: "#ffeaea",
    borderColor: "#f44336",
    borderWidth: 1,
  },
  messageText: {
    textAlign: "center",
    fontWeight: "500",
  },
  actions: {
    paddingTop: 16,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: emiColors.gold,
    borderRadius: 25,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  saveButtonLabel: {
    color: emiColors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
})
