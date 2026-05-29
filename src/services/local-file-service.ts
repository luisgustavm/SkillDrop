"use client";

import { sanitizeFileName } from "@/lib/sanitize";
import type { AcademicUpload } from "@/types/upload";

const DB_NAME = "skilldrop-local-files";
const STORE_NAME = "files";
const DB_VERSION = 1;
const LOCAL_FILE_PROTOCOL = "local://";

export type StoredLocalFile = {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  createdAt: number;
};

function assertBrowserStorage() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("Armazenamento local do navegador não está disponível.");
  }
}

function openDatabase() {
  assertBrowserStorage();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o IndexedDB."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha no armazenamento local."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Transação local falhou."));
    };
  });
}

export function createLocalFileUrl(localFileId: string) {
  return `${LOCAL_FILE_PROTOCOL}${localFileId}`;
}

export function getLocalFileIdFromUrl(fileUrl: string) {
  return fileUrl.startsWith(LOCAL_FILE_PROTOCOL) ? fileUrl.slice(LOCAL_FILE_PROTOCOL.length) : null;
}

export async function saveLocalFile(file: File) {
  const id = crypto.randomUUID();
  const record: StoredLocalFile = {
    id,
    blob: file,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified,
    createdAt: Date.now(),
  };

  await withStore("readwrite", (store) => store.put(record));

  return id;
}

export async function getLocalFile(localFileId: string) {
  const record = await withStore<StoredLocalFile | undefined>("readonly", (store) => store.get(localFileId));

  return record ?? null;
}

export async function openAcademicUpload(upload: AcademicUpload) {
  if (upload.storageProvider === "url" || upload.fileType === "link") {
    window.open(upload.fileUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const localFileId = upload.localFileId ?? getLocalFileIdFromUrl(upload.fileUrl);
  if (!localFileId) {
    throw new Error("Arquivo local não encontrado nos metadados.");
  }

  const record = await getLocalFile(localFileId);
  if (!record) {
    throw new Error("Este arquivo está salvo apenas no navegador em que foi enviado.");
  }

  const objectUrl = URL.createObjectURL(record.blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeFileName(fileName) || "skilldrop-material";
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadAcademicUpload(upload: AcademicUpload) {
  if (upload.storageProvider === "url" || upload.fileType === "link") {
    triggerDownload(upload.fileUrl, upload.fileName || upload.title);
    return;
  }

  const localFileId = upload.localFileId ?? getLocalFileIdFromUrl(upload.fileUrl);
  if (!localFileId) {
    throw new Error("Arquivo local não encontrado nos metadados.");
  }

  const record = await getLocalFile(localFileId);
  if (!record) {
    throw new Error("Este arquivo está salvo apenas no navegador em que foi enviado.");
  }

  const objectUrl = URL.createObjectURL(record.blob);
  triggerDownload(objectUrl, record.name || upload.fileName || upload.title);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
