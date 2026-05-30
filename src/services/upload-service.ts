"use client";

import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore } from "@/firebase/client";
import { sanitizeFileName, sanitizeText } from "@/lib/sanitize";
import { createLocalFileUrl } from "@/services/local-file-service";
import { createActivityLog } from "@/services/activity-service";
import type { AcademicUpload, CreateUploadInput, FileKind } from "@/types/upload";
import { classifyFile } from "@/utils/file";
import { toDate } from "@/utils/date";

type SaveUploadInput = {
  userId: string;
  file: File;
  metadata: CreateUploadInput;
  localFileId: string;
};

type SaveLinkInput = {
  userId: string;
  url: string;
  metadata: CreateUploadInput;
};

export async function saveUploadMetadata(input: SaveUploadInput) {
  const shareId = crypto.randomUUID();
  const safeFileName = sanitizeFileName(input.file.name);
  const payload = {
    userId: input.userId,
    title: sanitizeText(input.metadata.title, 120),
    description: sanitizeText(input.metadata.description, 1000),
    fileUrl: createLocalFileUrl(input.localFileId),
    storagePath: `indexeddb://${input.localFileId}`,
    storageProvider: "browser",
    localFileId: input.localFileId,
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
  await createActivityLog({
    userId: input.userId,
    type: input.metadata.visibility === "shared" ? "upload_shared" : "upload_created",
    message: `${payload.title} foi enviado.`,
    uploadId: uploadRef.id,
  });

  return uploadRef.id;
}

export async function saveLinkUpload(input: SaveLinkInput) {
  const parsedUrl = new URL(input.url);
  const shareId = crypto.randomUUID();
  const payload = {
    userId: input.userId,
    title: sanitizeText(input.metadata.title, 120),
    description: sanitizeText(input.metadata.description, 1000),
    fileUrl: parsedUrl.toString(),
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
  await createActivityLog({
    userId: input.userId,
    type: input.metadata.visibility === "shared" ? "upload_shared" : "upload_created",
    message: `${payload.title} foi salvo como link.`,
    uploadId: uploadRef.id,
  });

  return uploadRef.id;
}

export function listenUserUploads(
  userId: string,
  onData: (uploads: AcademicUpload[]) => void,
  onError: (error: Error) => void,
  resultLimit = 40,
): Unsubscribe {
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
  const storageProvider = data.storageProvider === "url" || fileUrl.startsWith("http") ? "url" : "browser";

  return {
    id,
    userId: String(data.userId),
    title: String(data.title),
    description: String(data.description ?? ""),
    fileUrl,
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
