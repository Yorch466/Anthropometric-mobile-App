"use client"

import { useState, useEffect } from "react"
import type { Upload } from "../types"
import {getCurrentUserId } from "../hooks/auth"
import { subscribeToUpload } from "@/lib/uploads"
export const useUploadStatus = (uploadId: string | null) => {
  const [upload, setUpload] = useState<Upload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uploadId) {
      setLoading(false)
      return
    }

    const userId = getCurrentUserId()
    if (!userId) {
      setError("User not authenticated")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToUpload(userId, uploadId, (uploadData) => {
      setUpload(uploadData)
      setLoading(false)

      if (uploadData?.status === "error") {
        setError("Processing failed")
      }
    })

    return unsubscribe
  }, [uploadId])

  return { upload, loading, error }
}
