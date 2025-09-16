// src/hooks/useUploadStatus.ts
import { useEffect, useRef, useState } from 'react';
import type { Upload } from '@/types';
import { getCurrentUserId } from '@/hooks/auth';
import { subscribeToUpload } from '@/lib/uploads';

/**
 * Observa en tiempo real el documento users/{uid}/uploads/{uploadId}.
 * - Devuelve { upload, loading, error }
 * - Maneja cambios de uploadId y desmontes sin setState después de unmount.
 * - Usa el UID actual de Firebase (o puedes pasar uno externo si lo prefieres).
 */
export const useUploadStatus = (uploadId: string | null, providedUserId?: string | null) => {
  const userId = providedUserId ?? getCurrentUserId();
  const [upload, setUpload] = useState<Upload | null>(null);
  const [loading, setLoading] = useState<boolean>(!!uploadId);
  const [error, setError] = useState<string | null>(null);

  // Evita setState después de unmount (Fast Refresh / navegación)
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // sin ID ⇒ no hay nada que escuchar
    if (!uploadId) {
      setUpload(null);
      setLoading(false);
      setError(null);
      return;
    }

    // sin usuario ⇒ no escuches
    if (!userId) {
      setUpload(null);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: undefined | (() => void);

    try {
      unsubscribe = subscribeToUpload(userId, uploadId, (uploadData) => {
        if (!mounted.current) return;
        setUpload(uploadData ?? null);
        setLoading(false);
        // si tu backend marca status === "error"
        if (uploadData?.status === 'error') setError('Processing failed');
      });
    } catch (e) {
      if (mounted.current) {
        setLoading(false);
        setError('Failed to subscribe to upload');
      }
    }

    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [uploadId, userId]);

  return { upload, loading, error };
};
