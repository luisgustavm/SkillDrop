"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import {
  getClientAuth,
  getClientFirestore,
  getFirebaseConfigError,
  isFirebaseConfigured,
  waitForAuthPersistence,
} from "@/firebase/client";
import { sanitizeFileName, sanitizeText } from "@/lib/sanitize";
import { createLocalFileUrl, deleteLocalFile } from "@/services/local-file-service";
import { normalizeRoomCode } from "@/services/room-service";
import type { AcademicUpload, CreateUploadInput, FileKind } from "@/types/upload";
import { classifyFile } from "@/utils/file";
import { toDate } from "@/utils/date";

type SaveUploadInput = {
  userId: string;
  roomId: string;
  file: File;
  metadata: CreateUploadInput;
  blob?: {
    url: string;
    downloadUrl?: string | null;
    pathname: string;
  } | null;
  localFileId?: string | null;
  inlineDataUrl?: string | null;
};

type SaveLinkInput = {
  userId: string;
  roomId: string;
  url: string;
  metadata: CreateUploadInput;
};

function normalizeScopedRoomId(roomId: string) {
  const normalized = normalizeRoomCode(roomId);
  if (normalized.length !== 8) throw new Error("Sala invalida para envio.");

  return normalized;
}

export async function saveUploadMetadata(input: SaveUploadInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = normalizeScopedRoomId(input.roomId);
  const shareId = crypto.randomUUID();
  const safeFileName = sanitizeFileName(input.file.name);
  const blob = input.blob ?? null;
  const inlineDataUrl = input.metadata.visibility === "shared" ? (input.inlineDataUrl?.trim() ?? "") : "";
  const usesInlineStorage = Boolean(inlineDataUrl);
  const localFileId = input.localFileId ?? null;

  if (!blob && !usesInlineStorage && !localFileId) {
    throw new Error("Nao foi possivel salvar o arquivo no Vercel Blob.");
  }

  const browserFileUrl = localFileId ? createLocalFileUrl(localFileId) : "";
  const browserStoragePath = localFileId ? `indexeddb://${localFileId}` : "";
  const fileUrl = blob?.url ?? (usesInlineStorage ? inlineDataUrl : browserFileUrl);
  const downloadUrl = blob?.downloadUrl ?? (blob ? blob.url : null);
  const storagePath = blob?.pathname ?? (usesInlineStorage ? `inline://${shareId}` : browserStoragePath);
  const storageProvider = blob ? "blob" : usesInlineStorage ? "inline" : "browser";
  const payload = {
    userId: input.userId,
    roomId,
    title: sanitizeText(input.metadata.title, 120),
    description: sanitizeText(input.metadata.description, 1000),
    fileUrl,
    downloadUrl,
    storagePath,
    storageProvider,
    localFileId,
    fileName: safeFileName,
    fileType: classifyFile(input.file),
    mimeType: input.file.type || "application/octet-stream",
    size: input.file.size,
    tags: input.metadata.tags,
    visibility: input.metadata.visibility,
    shareId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const uploadRef = await addDoc(collection(getClientFirestore(), collections.uploads), payload);

  return uploadRef.id;
}

export async function saveLinkUpload(input: SaveLinkInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = normalizeScopedRoomId(input.roomId);
  const parsedUrl = new URL(input.url);
  const shareId = crypto.randomUUID();
  const payload = {
    userId: input.userId,
    roomId,
    title: sanitizeText(input.metadata.title, 120),
    description: sanitizeText(input.metadata.description, 1000),
    fileUrl: parsedUrl.toString(),
    downloadUrl: parsedUrl.toString(),
    storagePath: "",
    storageProvider: "url",
    localFileId: null,
    fileName: parsedUrl.hostname,
    fileType: "link",
    mimeType: "text/uri-list",
    size: 0,
    tags: input.metadata.tags,
    visibility: input.metadata.visibility,
    shareId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const uploadRef = await addDoc(collection(getClientFirestore(), collections.uploads), payload);

  return uploadRef.id;
}

export async function deleteAcademicUpload(upload: AcademicUpload) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  if (upload.storageProvider === "blob") {
    await waitForAuthPersistence();
    const idToken = await getClientAuth().currentUser?.getIdToken();
    const response = await fetch("/api/blob/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ uploadId: upload.id }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Nao foi possivel excluir o arquivo do Vercel Blob.");
    }
  }

  await deleteDoc(doc(getClientFirestore(), collections.uploads, upload.id));

  if (upload.localFileId) {
    await deleteLocalFile(upload.localFileId).catch(() => undefined);
  }
}

export function listenRoomUploads(
  roomId: string,
  onData: (uploads: AcademicUpload[]) => void,
  onError: (error: Error) => void,
  resultLimit = 80,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const uploadsQuery = query(
    collection(getClientFirestore(), collections.uploads),
    where("roomId", "==", normalizeScopedRoomId(roomId)),
    orderBy("createdAt", "desc"),
    limit(resultLimit),
  );

  return onSnapshot(
    uploadsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapUpload(item.id, item.data()))),
    onError,
  );
}

export function listenUserUploads(
  userId: string,
  onData: (uploads: AcademicUpload[]) => void,
  onError: (error: Error) => void,
  resultLimit = 40,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const uploadsQuery = query(
    collection(getClientFirestore(), collections.uploads),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(resultLimit),
  );

  return onSnapshot(
    uploadsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapUpload(item.id, item.data()))),
    onError,
  );
}

export function listenSharedUploadByShareId(
  shareId: string,
  onData: (upload: AcademicUpload | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData(null);
    return () => undefined;
  }

  const uploadsQuery = query(
    collection(getClientFirestore(), collections.uploads),
    where("shareId", "==", shareId),
    where("visibility", "==", "shared"),
    limit(1),
  );

  return onSnapshot(
    uploadsQuery,
    (snapshot) => onData(snapshot.docs[0] ? mapUpload(snapshot.docs[0].id, snapshot.docs[0].data()) : null),
    onError,
  );
}

export function mapUpload(id: string, data: Record<string, unknown>): AcademicUpload {
  const fileUrl = String(data.fileUrl);
  const rawStorageProvider = String(data.storageProvider ?? "");
  const storageProvider =
    rawStorageProvider === "blob" || fileUrl.includes(".blob.vercel-storage.com")
      ? "blob"
      : rawStorageProvider === "url" || fileUrl.startsWith("http")
      ? "url"
      : rawStorageProvider === "inline" || fileUrl.startsWith("data:")
        ? "inline"
        : "browser";

  return {
    id,
    userId: String(data.userId),
    roomId: typeof data.roomId === "string" ? data.roomId : null,
    title: String(data.title),
    description: String(data.description ?? ""),
    fileUrl,
    downloadUrl: typeof data.downloadUrl === "string" ? data.downloadUrl : null,
    storagePath: String(data.storagePath),
    storageProvider,
    localFileId: typeof data.localFileId === "string" ? data.localFileId : null,
    fileName: String(data.fileName),
    fileType: String(data.fileType ?? "other") as FileKind,
    mimeType: String(data.mimeType ?? "application/octet-stream"),
    size: Number(data.size ?? 0),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    visibility: data.visibility === "shared" ? "shared" : "private",
    shareId: String(data.shareId),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}
