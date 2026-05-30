"use client";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore } from "@/firebase/client";
import { sanitizeText } from "@/lib/sanitize";
import type { GlobalChatAttachment, PrivateRoom, RoomMessage } from "@/types/chat";
import { toDate } from "@/utils/date";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 8;

type CreateRoomInput = {
  userId: string;
  ownerName: string;
  name: string;
};

type JoinRoomInput = {
  userId: string;
  code: string;
};

type SendRoomMessageInput = {
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachment?: GlobalChatAttachment | null;
};

export function normalizeRoomCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, ROOM_CODE_LENGTH);
}

function createRoomCode() {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_CODE_LENGTH));

  return Array.from(values, (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]).join("");
}

function roomsCollection() {
  return collection(getClientFirestore(), collections.rooms);
}

function roomDocument(roomId: string) {
  return doc(getClientFirestore(), collections.rooms, normalizeRoomCode(roomId));
}

function roomMessagesCollection(roomId: string) {
  return collection(roomDocument(roomId), "messages");
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = createRoomCode();
    const snapshot = await getDoc(roomDocument(code));

    if (!snapshot.exists()) return code;
  }

  throw new Error("Não foi possível gerar um código de sala. Tente novamente.");
}

export async function createPrivateRoom(input: CreateRoomInput) {
  const code = await createUniqueRoomCode();
  const name = sanitizeText(input.name, 80) || "Sala de estudos";
  const ownerName = sanitizeText(input.ownerName, 80) || "Estudante";

  await setDoc(roomDocument(code), {
    code,
    name,
    ownerId: input.userId,
    ownerName,
    memberIds: [input.userId],
    memberCount: 1,
    lastMessageText: "",
    lastMessageAuthorName: "",
    lastMessageAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return code;
}

export async function joinPrivateRoom(input: JoinRoomInput) {
  const code = normalizeRoomCode(input.code);

  if (code.length !== ROOM_CODE_LENGTH) {
    throw new Error("Informe um código de sala válido.");
  }

  await runTransaction(getClientFirestore(), async (transaction) => {
    const roomRef = roomDocument(code);
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      throw new Error("Sala não encontrada. Confira o código ou peça um novo link.");
    }

    const data = snapshot.data();
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds.map(String) : [];

    if (memberIds.includes(input.userId)) return;

    transaction.update(roomRef, {
      memberIds: arrayUnion(input.userId),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  });

  return code;
}

export function listenUserRooms(
  userId: string,
  onData: (rooms: PrivateRoom[]) => void,
  onError: (error: Error) => void,
  resultLimit = 30,
): Unsubscribe {
  const roomsQuery = query(
    roomsCollection(),
    where("memberIds", "array-contains", userId),
    orderBy("updatedAt", "desc"),
    limit(resultLimit),
  );

  return onSnapshot(
    roomsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapRoom(item.id, item.data()))),
    onError,
  );
}

export function listenRoomMessages(
  roomId: string,
  onData: (messages: RoomMessage[]) => void,
  onError: (error: Error) => void,
  resultLimit = 80,
): Unsubscribe {
  const messagesQuery = query(roomMessagesCollection(roomId), orderBy("createdAt", "desc"), limit(resultLimit));

  return onSnapshot(
    messagesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapRoomMessage(item.id, item.data())).reverse()),
    onError,
  );
}

export async function sendRoomMessage(roomId: string, input: SendRoomMessageInput) {
  const content = sanitizeText(input.content, 1000);
  const attachment = input.attachment ?? null;

  if (!content && !attachment) {
    throw new Error("Escreva uma mensagem ou selecione um anexo.");
  }

  const authorName = sanitizeText(input.authorName, 80) || "Estudante";
  await addDoc(roomMessagesCollection(roomId), {
    userId: input.userId,
    authorName,
    authorAvatar: input.authorAvatar,
    content,
    attachment,
    createdAt: serverTimestamp(),
  });

  await updateDoc(roomDocument(roomId), {
    lastMessageText: content || `Anexo: ${attachment?.name ?? "arquivo"}`,
    lastMessageAuthorName: authorName,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function mapAttachment(value: unknown): GlobalChatAttachment | null {
  if (!value || typeof value !== "object") return null;

  const attachment = value as Record<string, unknown>;

  return {
    name: String(attachment.name ?? "arquivo-skilldrop"),
    mimeType: String(attachment.mimeType ?? "application/octet-stream"),
    size: Number(attachment.size ?? 0),
    dataUrl: String(attachment.dataUrl ?? ""),
    kind: attachment.kind === "image" ? "image" : "file",
  };
}

function mapRoom(id: string, data: Record<string, unknown>): PrivateRoom {
  return {
    id,
    code: String(data.code ?? id),
    name: String(data.name ?? "Sala de estudos"),
    ownerId: String(data.ownerId ?? ""),
    ownerName: String(data.ownerName ?? "Estudante"),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds.map(String) : [],
    memberCount: Number(data.memberCount ?? 1),
    lastMessageText: String(data.lastMessageText ?? ""),
    lastMessageAuthorName: String(data.lastMessageAuthorName ?? ""),
    lastMessageAt: toDate(data.lastMessageAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapRoomMessage(id: string, data: Record<string, unknown>): RoomMessage {
  return {
    id,
    userId: String(data.userId),
    authorName: String(data.authorName ?? "Estudante"),
    authorAvatar: typeof data.authorAvatar === "string" ? data.authorAvatar : null,
    content: String(data.content ?? ""),
    attachment: mapAttachment(data.attachment),
    createdAt: toDate(data.createdAt),
  };
}
