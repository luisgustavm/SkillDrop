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
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { collections } from "@/firebase/collections";
import { getClientFirestore, getClientStorage, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import { sanitizeFileName, sanitizeText } from "@/lib/sanitize";
import { deleteLocalFile } from "@/services/local-file-service";
import { createActivityLog } from "@/services/activity-service";
import { normalizeRoomCode } from "@/services/room-service";
import type { AcademicUpload, CreateUploadInput, FileKind, UploadProgress } from "@/types/upload";
import { classifyFile } from "@/utils/file";
import { toDate } from "@/utils/date";

type SaveUploadInput = {
  userId: string;
  roomId: string;
  file: File;
  metadata: CreateUploadInput;
  fileUrl: string;
  storagePath: string;
};

type SaveLinkInput = {
  userId: string;
  roomId: string;
  url: string;
  metadata: CreateUploadInput;
};

type UploadAcademicFileInput = {
  userId: string;
  roomId: string;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
};

function normalizeScopedRoomId(roomId: string) {
  const normalized = normalizeRoomCode(roomId);
  if (normalized.length !== 8) throw new Error("Sala invalida para envio.");

  return normalized;
}

function createStoragePath(userId: string, roomId: string, fileName: string) {
  const safeFileName = sanitizeFileName(fileName) || "skilldrop-material";

  return `rooms/${normalizeScopedRoomId(roomId)}/uploads/${userId}/${crypto.randomUUID()}-${safeFileName}`;
}

export async function uploadAcademicFile(input: UploadAcademicFileInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const storagePath = createStoragePath(input.userId, input.roomId, input.file.name);
  const storageRef = ref(getClientStorage(), storagePath);
  const uploadTask = uploadBytesResumable(storageRef, input.file, {
    contentType: input.file.type || "application/octet-stream",
    customMetadata: {
      roomId: normalizeScopedRoomId(input.roomId),
      userId: input.userId,
    },
  });

  return new Promise<{ fileUrl: string; storagePath: string }>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percentage = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;

        input.onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage,
        });
      },
      reject,
      async () => {
        try {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ fileUrl, storagePath });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

export async function saveUploadMetadata(input: SaveUploadInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = normalizeScopedRoomId(input.roomId);
  const shareId = crypto.randomUUID();
  const safeFileName = sanitizeFileName(input.file.name);
  const payload = {
    userId: input.userId,
    roomId,
    title: sanitizeText(input.metadata.title, 120),
    description: sanitizeText(input.metadata.description, 1000),
    fileUrl: input.fileUrl,
    storagePath: input.storagePath,
    storageProvider: "firebase",
    localFileId: null,
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
    roomId,
    type: input.metadata.visibility === "shared" ? "upload_shared" : "upload_created",
    message: `${payload.title} foi enviado.`,
    uploadId: uploadRef.id,
  });

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
    roomId,
    type: input.metadata.visibility === "shared" ? "upload_shared" : "upload_created",
    message: `${payload.title} foi salvo como link.`,
    uploadId: uploadRef.id,
  });

  return uploadRef.id;
}

export async function deleteAcademicUpload(upload: AcademicUpload) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await deleteDoc(doc(getClientFirestore(), collections.uploads, upload.id));

  if (upload.storageProvider === "firebase" && upload.storagePath) {
    await deleteObject(ref(getClientStorage(), upload.storagePath)).catch(() => undefined);
  }

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
  const storageProvider = rawStorageProvider === "firebase"
    ? "firebase"
    : rawStorageProvider === "url" || fileUrl.startsWith("http")
      ? "url"
      : "browser";

  return {
    id,
    userId: String(data.userId),
    roomId: typeof data.roomId === "string" ? data.roomId : null,
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
