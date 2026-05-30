"use client";

import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore } from "@/firebase/client";
import { ACCEPTED_EXTENSIONS } from "@/lib/constants";
import { sanitizeFileName, sanitizeText } from "@/lib/sanitize";
import type { GlobalChatAttachment, GlobalChatMessage } from "@/types/chat";
import { toDate } from "@/utils/date";
import { getFileExtension } from "@/utils/file";

export const MAX_GLOBAL_CHAT_ATTACHMENT_BYTES = 512 * 1024;

type SendGlobalMessageInput = {
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachment?: GlobalChatAttachment | null;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export async function createGlobalChatAttachment(file: File): Promise<GlobalChatAttachment> {
  const extension = getFileExtension(file.name);
  const isImage = file.type.startsWith("image/");

  if (file.size > MAX_GLOBAL_CHAT_ATTACHMENT_BYTES) {
<<<<<<< HEAD
    throw new Error("O anexo precisa ter até 512 KB.");
  }

  if (!isImage && !ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error(`Formato .${extension || "desconhecido"} não é aceito.`);
=======
    throw new Error("O anexo precisa ter até 512 KB no chat global.");
  }

  if (!isImage && !ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error(`Formato .${extension || "desconhecido"} não é aceito no chat global.`);
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
  }

  return {
    name: sanitizeFileName(file.name) || "arquivo-skilldrop",
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl: await readFileAsDataUrl(file),
    kind: isImage ? "image" : "file",
  };
}

export async function sendGlobalMessage(input: SendGlobalMessageInput) {
  const content = sanitizeText(input.content, 1000);
  const attachment = input.attachment ?? null;

  if (!content && !attachment) {
    throw new Error("Escreva uma mensagem ou selecione um anexo.");
  }

  await addDoc(collection(getClientFirestore(), collections.globalMessages), {
    userId: input.userId,
    authorName: sanitizeText(input.authorName, 80) || "Estudante",
    authorAvatar: input.authorAvatar,
    content,
    attachment,
    createdAt: serverTimestamp(),
  });
}

function mapAttachment(value: unknown): GlobalChatAttachment | null {
  if (!value || typeof value !== "object") return null;

  const attachment = value as Record<string, unknown>;
  const kind = attachment.kind === "image" ? "image" : "file";

  return {
    name: String(attachment.name ?? "arquivo-skilldrop"),
    mimeType: String(attachment.mimeType ?? "application/octet-stream"),
    size: Number(attachment.size ?? 0),
    dataUrl: String(attachment.dataUrl ?? ""),
    kind,
  };
}

export function listenGlobalMessages(
  onData: (messages: GlobalChatMessage[]) => void,
  onError: (error: Error) => void,
  resultLimit = 80,
): Unsubscribe {
  const messagesQuery = query(
    collection(getClientFirestore(), collections.globalMessages),
    orderBy("createdAt", "desc"),
    limit(resultLimit),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          userId: String(data.userId),
          authorName: String(data.authorName ?? "Estudante"),
          authorAvatar: typeof data.authorAvatar === "string" ? data.authorAvatar : null,
          content: String(data.content ?? ""),
          attachment: mapAttachment(data.attachment),
          createdAt: toDate(data.createdAt),
        };
      });

      onData(messages.reverse());
    },
    onError,
  );
}
