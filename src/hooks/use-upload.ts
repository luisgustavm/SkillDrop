"use client";

import { upload as uploadBlob } from "@vercel/blob/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAuth, waitForAuthPersistence } from "@/firebase/client";
import { getFirebaseErrorMessage } from "@/firebase/errors";
import { sanitizeFileName } from "@/lib/sanitize";
import { saveUploadMetadata } from "@/services/upload-service";
import type { CreateUploadInput, UploadProgress } from "@/types/upload";
import { validateUploadFile } from "@/utils/file";

type UploadStatus = "idle" | "ready" | "uploading" | "paused" | "completed" | "error" | "cancelled";

function normalizeRoomCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

export function useUpload(userId?: string, roomId?: string) {
  const cancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryRef = useRef<{ file: File; metadata: CreateUploadInput } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<UploadProgress>({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || (!file.type.startsWith("image/") && !file.type.startsWith("video/") && file.type !== "application/pdf")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = useCallback((nextFile: File | null) => {
    setError(null);
    setProgress({ bytesTransferred: 0, totalBytes: nextFile?.size ?? 0, percentage: 0 });

    if (!nextFile) {
      setFile(null);
      setStatus("idle");
      return;
    }

    const validationError = validateUploadFile(nextFile);
    if (validationError) {
      setFile(null);
      setStatus("error");
      setError(validationError);
      return;
    }

    setFile(nextFile);
    setStatus("ready");
  }, []);

  const startUpload = useCallback(
    async (metadata: CreateUploadInput, overrideFile?: File) => {
      const currentFile = overrideFile ?? file;

      if (!userId) {
        setError("Entre na sua conta para enviar arquivos.");
        setStatus("error");
        return;
      }

      if (!roomId) {
        setError("Entre em uma sala para enviar arquivos.");
        setStatus("error");
        return;
      }

      if (!currentFile) {
        setError("Selecione um arquivo antes de enviar.");
        setStatus("error");
        return;
      }

      retryRef.current = { file: currentFile, metadata };
      cancelledRef.current = false;
      setStatus("uploading");
      setError(null);
      setProgress({ bytesTransferred: 0, totalBytes: currentFile.size, percentage: 8 });

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        await waitForAuthPersistence();
        const idToken = await getClientAuth().currentUser?.getIdToken();

        if (!idToken) {
          throw new Error("Entre novamente para enviar arquivos.");
        }

        const safeFileName = sanitizeFileName(currentFile.name) || "material";
        const normalizedRoomId = normalizeRoomCode(roomId);
        const blobPath = `rooms/${normalizedRoomId}/${userId}/${crypto.randomUUID()}-${safeFileName}`;
        const blob = await uploadBlob(blobPath, currentFile, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          clientPayload: JSON.stringify({ roomId: normalizedRoomId }),
          headers: { Authorization: `Bearer ${idToken}` },
          contentType: currentFile.type || "application/octet-stream",
          multipart: currentFile.size > 4.5 * 1024 * 1024,
          abortSignal: abortController.signal,
          onUploadProgress: ({ loaded, total, percentage }) => {
            setProgress({
              bytesTransferred: loaded,
              totalBytes: total,
              percentage: Math.min(94, Math.max(8, Math.round(percentage * 0.86))),
            });
          },
        });

        if (cancelledRef.current) throw new Error("Upload cancelado.");

        setProgress({ bytesTransferred: currentFile.size, totalBytes: currentFile.size, percentage: 96 });
        await saveUploadMetadata({
          userId,
          roomId,
          file: currentFile,
          metadata,
          blob,
        });
        if (cancelledRef.current) throw new Error("Upload cancelado.");

        setProgress({ bytesTransferred: currentFile.size, totalBytes: currentFile.size, percentage: 100 });
        setStatus("completed");
      } catch (uploadError) {
        const message =
          uploadError instanceof DOMException && uploadError.name === "AbortError"
            ? "Upload cancelado."
            : getFirebaseErrorMessage(uploadError);
        setStatus(message === "Upload cancelado." ? "cancelled" : "error");
        setError(message);
        throw new Error(message);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [file, roomId, userId],
  );

  const pauseUpload = useCallback(() => {
    setStatus("paused");
  }, []);

  const resumeUpload = useCallback(() => {
    setStatus("uploading");
  }, []);

  const cancelUpload = useCallback(() => {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    setStatus("cancelled");
  }, []);

  const retryUpload = useCallback(async () => {
    if (!retryRef.current) return;
    await startUpload(retryRef.current.metadata, retryRef.current.file);
  }, [startUpload]);

  return {
    file,
    previewUrl,
    status,
    progress,
    error,
    selectFile,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
  };
}
