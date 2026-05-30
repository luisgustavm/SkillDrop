"use client";

import type { GlobalChatAttachment, PrivateRoom, RoomMessage } from "@/types/chat";

const DEMO_ROOMS_KEY = "skilldrop_demo_rooms";
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 8;

type StoredDemoRoom = Omit<PrivateRoom, "createdAt" | "updatedAt" | "lastMessageAt"> & {
  createdAt: string | null;
  updatedAt: string | null;
  lastMessageAt: string | null;
  messages: Array<Omit<RoomMessage, "createdAt"> & { createdAt: string | null }>;
};

type DemoRoomInput = {
  userId: string;
  ownerName: string;
  name: string;
};

type DemoMessageInput = {
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachment?: GlobalChatAttachment | null;
};

function normalizeCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, ROOM_CODE_LENGTH);
}

function createCode() {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_CODE_LENGTH));

  return Array.from(values, (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]).join("");
}

function readRooms(): StoredDemoRoom[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(DEMO_ROOMS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRooms(rooms: StoredDemoRoom[]) {
  localStorage.setItem(DEMO_ROOMS_KEY, JSON.stringify(rooms));
}

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function mapRoom(room: StoredDemoRoom): PrivateRoom {
  return {
    ...room,
    createdAt: toDate(room.createdAt),
    updatedAt: toDate(room.updatedAt),
    lastMessageAt: toDate(room.lastMessageAt),
  };
}

function mapMessage(message: StoredDemoRoom["messages"][number]): RoomMessage {
  return {
    ...message,
    createdAt: toDate(message.createdAt),
  };
}

export function listDemoRooms(userId: string) {
  return readRooms()
    .filter((room) => room.memberIds.includes(userId))
    .sort((current, next) => String(next.updatedAt).localeCompare(String(current.updatedAt)))
    .map(mapRoom);
}

export function listDemoRoomMessages(roomId: string) {
  const room = readRooms().find((item) => item.id === normalizeCode(roomId));

  return room?.messages.map(mapMessage) ?? [];
}

export function createDemoRoom(input: DemoRoomInput) {
  const rooms = readRooms();
  let code = createCode();

  while (rooms.some((room) => room.id === code)) {
    code = createCode();
  }

  const now = new Date().toISOString();
  const room: StoredDemoRoom = {
    id: code,
    code,
    name: input.name.trim() || "Sala de estudos",
    ownerId: input.userId,
    ownerName: input.ownerName,
    memberIds: [input.userId],
    memberCount: 1,
    lastMessageText: "",
    lastMessageAuthorName: "",
    lastMessageAt: null,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  writeRooms([room, ...rooms]);

  return code;
}

export function joinDemoRoom(userId: string, rawCode: string) {
  const code = normalizeCode(rawCode);
  const rooms = readRooms();
  const roomIndex = rooms.findIndex((room) => room.id === code);

  if (roomIndex === -1) {
    throw new Error("Sala de teste não encontrada. Crie uma sala primeiro e copie o código.");
  }

  const room = rooms[roomIndex];
  if (!room.memberIds.includes(userId)) {
    room.memberIds.push(userId);
    room.memberCount = room.memberIds.length;
    room.updatedAt = new Date().toISOString();
    writeRooms(rooms);
  }

  return code;
}

export function sendDemoRoomMessage(roomId: string, input: DemoMessageInput) {
  const code = normalizeCode(roomId);
  const rooms = readRooms();
  const roomIndex = rooms.findIndex((room) => room.id === code);

  if (roomIndex === -1) {
    throw new Error("Sala de teste não encontrada.");
  }

  const room = rooms[roomIndex];
  const now = new Date().toISOString();
  const content = input.content.trim();
  const attachment = input.attachment ?? null;
  const message: StoredDemoRoom["messages"][number] = {
    id: crypto.randomUUID(),
    userId: input.userId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    content,
    attachment,
    createdAt: now,
  };

  room.messages.push(message);
  room.lastMessageText = content || `Anexo: ${attachment?.name ?? "arquivo"}`;
  room.lastMessageAuthorName = input.authorName;
  room.lastMessageAt = now;
  room.updatedAt = now;
  writeRooms(rooms);
}
