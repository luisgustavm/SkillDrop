"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFirebaseErrorMessage } from "@/firebase/errors";
import { saveLocalFile } from "@/services/local-file-service";
import { saveUploadMetadata } from "@/services/upload-service";
import type { CreateUploadInput, UploadProgress } from "@/types/upload";
import { validateUploadFile } from "@/utils/file";

type UploadStatus = "idle" | "ready" | "uploading" | "paused" | "completed" | "error" | "cancelled";

export function useUpload(userId?: string) {
  const cancelledRef = useRef(false);
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
        const localFileId = await saveLocalFile(currentFile);
        if (cancelledRef.current) throw new Error("Upload cancelado.");

        setProgress({ bytesTransferred: Math.round(currentFile.size * 0.72), totalBytes: currentFile.size, percentage: 72 });
        await saveUploadMetadata({
          userId,
          file: currentFile,
          metadata,
          localFileId,
        });
        if (cancelledRef.current) throw new Error("Upload cancelado.");

        setProgress({ bytesTransferred: currentFile.size, totalBytes: currentFile.size, percentage: 100 });
        setStatus("completed");
      } catch (uploadError) {
        const message = getFirebaseErrorMessage(uploadError);
        setStatus(message === "Upload cancelado." ? "cancelled" : "error");
        setError(message);
        throw new Error(message);
      }
    },
    [file, userId],
  );

  const pauseUpload = useCallback(() => {
    setStatus("paused");
  }, []);

  const resumeUpload = useCallback(() => {
    setStatus("uploading");
  }, []);

  const cancelUpload = useCallback(() => {
    cancelledRef.current = true;
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
