// src/screens/HistoryScreen.tsx
"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Card, Text, ActivityIndicator, Chip, IconButton } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "@/navigation/AppNavigator"
import { getCurrentUserId } from "@/hooks/auth"
import { getUserUploads } from "@/lib/firestore"
import type { Upload } from "@/types"
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore"
import BottomActionBar from "@/components/BottomActivationBar" // si tu archivo es BottomActivationBar, cambia este import

// Colores EMI
const emiBlue = "#0052a5"
const emiGold = "#e9b400"
const bg = "#FFFFFF"
const muted = "#666"

type HistoryNavigationProp = NativeStackNavigationProp<RootStackParamList, "History">

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryNavigationProp>()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)

  const ITEMS_PER_PAGE = 10

  // Recarga al enfocar y un pequeño segundo intento para capturar propagación de Firestore
  useFocusEffect(
    useCallback(() => {
      loadUploads(true)
      const t = setTimeout(() => loadUploads(true), 700)
      return () => clearTimeout(t)
    }, []),
  )

  const loadUploads = async (refresh = false) => {
    if (refresh) {
      setLoading(true)
      setUploads([])
      setCursor(null)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const userId = getCurrentUserId()
      if (!userId) return

      // Tu helper devuelve { items, nextCursor }
      const { items, nextCursor } = await getUserUploads(userId, ITEMS_PER_PAGE, refresh ? null : cursor)

      setUploads((prev) => (refresh ? items : [...prev, ...items]))
      setCursor(nextCursor ?? null)
      setHasMore(!!nextCursor)
    } catch (error) {
      console.error("Error loading uploads:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadUploads(true)
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadUploads(false)
  }

  const handleUploadPress = (upload: Upload) => {
    if ((upload.status === "planned" || upload.status === "completed") && upload.predId && upload.planId) {
      navigation.navigate("Results", {
        uploadId: upload.id,
        predId: String(upload.predId),
        planId: String(upload.planId),
      })
    }
  }

  const getStatusColor = (status: Upload["status"]): string => {
    switch (status) {
      case "pending": return emiGold
      case "predicted": return emiBlue
      case "planned": return emiBlue
      case "completed": return emiBlue
      case "error": return "#f44336"
      default: return "#9e9e9e"
    }
  }

  const getStatusText = (status: Upload["status"]): string => {
    switch (status) {
      case "pending": return "Procesando"
      case "predicted": return "Predicción lista"
      case "planned": return "Plan completo"
      case "completed": return "Plan completo"
      case "error": return "Error"
      default: return "Desconocido"
    }
  }

  // Acepta Firestore Timestamp o Date
  const formatDate = (dateLike: any): string => {
    const d = dateLike?.toDate ? dateLike.toDate() : (dateLike instanceof Date ? dateLike : new Date())
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(d)
  }

  const renderUploadItem = ({ item }: { item: Upload }) => {
    const canNavigate = (item.status === "planned" || item.status === "completed") && item.predId && item.planId
    const statusColor = getStatusColor(item.status)

    return (
      <TouchableOpacity onPress={() => handleUploadPress(item)} disabled={!canNavigate} activeOpacity={canNavigate ? 0.7 : 1}>
        <Card style={[styles.uploadCard, !canNavigate && styles.disabledCard]}>
          <Card.Content>
            <View style={styles.uploadHeader}>
              <View style={styles.uploadInfo}>
                <Text variant="titleMedium" style={styles.uploadDate}>{formatDate(item.createdAt)}</Text>
                <Text variant="bodyMedium" style={styles.uploadDetails}>
                  {item.sex === 0 ? "Femenino" : "Masculino"} • {item.goals.run_s}s • {item.goals.push} flexiones • {item.goals.sit} abdominales
                </Text>
              </View>
              {canNavigate && <IconButton icon="chevron-right" size={20} />}
            </View>

            <View style={styles.uploadFooter}>
              <Chip
                style={[styles.statusChip, { backgroundColor: statusColor + "20" }]}
                textStyle={[styles.statusChipText, { color: statusColor }]}
              >
                {getStatusText(item.status)}
              </Chip>

              <View style={styles.constraintsContainer}>
                {item.constraints.vegan && <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>Vegano</Chip>}
                {item.constraints.gluten_free && <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>Sin Gluten</Chip>}
                {item.constraints.lactose_free && <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>Sin Lactosa</Chip>}
                {(item.constraints.inj_knee || item.constraints.inj_shoulder || item.constraints.inj_back) &&
                  <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>Lesiones</Chip>}
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={emiBlue} />
        <Text variant="bodyMedium" style={styles.footerLoaderText}>Cargando más...</Text>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="history" size={64} iconColor={emiGold} />
        <Text variant="headlineSmall" style={styles.emptyTitle}>Sin historial</Text>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Aún no has subido ninguna imagen. Comienza tu análisis fitness subiendo tu primera foto.
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={emiBlue} />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando historial...</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={uploads}
        renderItem={renderUploadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[emiBlue]} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
      <BottomActionBar />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bg, justifyContent: "space-between" },

  container: { flex: 1, backgroundColor: bg },
  listContainer: { padding: 20, paddingBottom: 100, flexGrow: 1 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg },
  loadingText: { marginTop: 16, color: emiBlue, fontWeight: "500" },

  uploadCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: emiBlue,
    backgroundColor: "#FFFFFF",
  },
  disabledCard: { opacity: 0.7 },

  uploadHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  uploadInfo: { flex: 1 },
  uploadDate: { fontWeight: "700", color: emiBlue, marginBottom: 4, fontSize: 16 },
  uploadDetails: { color: muted, fontSize: 14 },

  uploadFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  statusChip: { height: 32, elevation: 1 },
  statusChipText: { fontSize: 12, fontWeight: "700" },

  constraintsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 4, flex: 1, justifyContent: "flex-end" },
  constraintChip: { height: 30, backgroundColor: emiGold, elevation: 1 },
  constraintChipText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },

  footerLoader: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 20, gap: 8 },
  footerLoaderText: { color: emiBlue, fontWeight: "500" },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontWeight: "700", color: emiBlue, marginBottom: 8, marginTop: 16, fontSize: 20 },
  emptyText: { color: muted, textAlign: "center", paddingHorizontal: 20, lineHeight: 24, fontSize: 16 },
})
