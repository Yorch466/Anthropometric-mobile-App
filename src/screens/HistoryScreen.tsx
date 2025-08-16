"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Card, Text, ActivityIndicator, Chip, IconButton } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { getCurrentUserId } from "../lib/firebase"
import { getUserUploads } from "../lib/firestore"
import type { Upload } from "../types"

type HistoryNavigationProp = NativeStackNavigationProp<RootStackParamList, "History">

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryNavigationProp>()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 10

  useFocusEffect(
    useCallback(() => {
      loadUploads(true)
    }, []),
  )

  const loadUploads = async (refresh = false) => {
    if (refresh) {
      setLoading(true)
      setUploads([])
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const userId = getCurrentUserId()
      if (!userId) return

      const limit = refresh ? ITEMS_PER_PAGE : ITEMS_PER_PAGE
      const newUploads = await getUserUploads(userId, limit)

      if (refresh) {
        setUploads(newUploads)
      } else {
        setUploads((prev) => [...prev, ...newUploads])
      }

      setHasMore(newUploads.length === limit)
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
    if (!loadingMore && hasMore) {
      loadUploads(false)
    }
  }

  const handleUploadPress = (upload: Upload) => {
    if (upload.status === "planned" && upload.predId && upload.planId) {
      navigation.navigate("Results", {
        uploadId: upload.id,
        predId: upload.predId,
        planId: upload.planId,
      })
    }
  }

  const getStatusColor = (status: Upload["status"]): string => {
    switch (status) {
      case "pending":
        return "#ff9800"
      case "predicted":
        return "#2196f3"
      case "planned":
        return "#4caf50"
      case "error":
        return "#f44336"
      default:
        return "#9e9e9e"
    }
  }

  const getStatusText = (status: Upload["status"]): string => {
    switch (status) {
      case "pending":
        return "Procesando"
      case "predicted":
        return "Predicción lista"
      case "planned":
        return "Plan completo"
      case "error":
        return "Error"
      default:
        return "Desconocido"
    }
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const renderUploadItem = ({ item }: { item: Upload }) => {
    const canNavigate = item.status === "planned" && item.predId && item.planId
    const statusColor = getStatusColor(item.status)

    return (
      <TouchableOpacity
        onPress={() => handleUploadPress(item)}
        disabled={!canNavigate}
        activeOpacity={canNavigate ? 0.7 : 1}
      >
        <Card style={[styles.uploadCard, !canNavigate && styles.disabledCard]}>
          <Card.Content>
            <View style={styles.uploadHeader}>
              <View style={styles.uploadInfo}>
                <Text variant="titleMedium" style={styles.uploadDate}>
                  {formatDate(item.createdAt)}
                </Text>
                <Text variant="bodyMedium" style={styles.uploadDetails}>
                  {item.sex === 0 ? "Femenino" : "Masculino"} • {item.goals.run_s}s • {item.goals.push} flexiones •{" "}
                  {item.goals.sit} abdominales
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

              {/* Constraints indicators */}
              <View style={styles.constraintsContainer}>
                {item.constraints.vegan && (
                  <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>
                    Vegano
                  </Chip>
                )}
                {item.constraints.gluten_free && (
                  <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>
                    Sin Gluten
                  </Chip>
                )}
                {item.constraints.lactose_free && (
                  <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>
                    Sin Lactosa
                  </Chip>
                )}
                {(item.constraints.inj_knee || item.constraints.inj_shoulder || item.constraints.inj_back) && (
                  <Chip style={styles.constraintChip} textStyle={styles.constraintChipText}>
                    Lesiones
                  </Chip>
                )}
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
        <ActivityIndicator size="small" color="#4a90e2" />
        <Text variant="bodyMedium" style={styles.footerLoaderText}>
          Cargando más...
        </Text>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null

    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="history" size={64} iconColor="#ccc" />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Sin historial
        </Text>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Aún no has subido ninguna imagen. Comienza tu análisis fitness subiendo tu primera foto.
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando historial...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={uploads}
        renderItem={renderUploadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#4a90e2"]} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  uploadCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 16,
  },
  disabledCard: {
    opacity: 0.7,
  },
  uploadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadDate: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  uploadDetails: {
    color: "#666",
  },
  uploadFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  constraintsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  constraintChip: {
    height: 24,
    backgroundColor: "#e0e0e0",
  },
  constraintChipText: {
    fontSize: 10,
    color: "#666",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    marginTop: 16,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
})
