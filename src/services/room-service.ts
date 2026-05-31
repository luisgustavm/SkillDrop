"use client";

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
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
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import { sanitizeText } from "@/lib/sanitize";
import type { NotificationKind } from "@/types/academic";
import type {
  GlobalChatAttachment,
  PrivateRoom,
  RoomDirectMessage,
  RoomJoinRequest,
  RoomMemberProfile,
  RoomMessage,
} from "@/types/chat";
import { toDate } from "@/utils/date";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 8;

type CreateRoomInput = {
  userId: string;
  ownerName: string;
  ownerAvatar: string | null;
  name: string;
};

type RequestJoinRoomInput = {
  userId: string;
  userName: string;
  userAvatar: string | null;
  code: string;
};

type RequestJoinRoomResult = {
  code: string;
  status: "already-member" | "pending" | "created";
};

type ReviewJoinRequestInput = {
  roomId: string;
  requestUserId: string;
};

type UpdateRoomMemberRoleInput = {
  roomId: string;
  memberUserId: string;
  role: RoomMemberProfile["role"];
};

type RemoveRoomMemberInput = {
  roomId: string;
  memberUserId: string;
  ban?: boolean;
};

type RoomNotificationInput = {
  userId: string;
  roomId: string;
  title: string;
  message: string;
  kind: NotificationKind;
};

type OwnerJoinNotification = {
  ownerId: string;
  roomName: string;
  requesterName: string;
};

type RequestReviewNotification = {
  userId: string;
  roomName: string;
};

type SendRoomMessageInput = {
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachment?: GlobalChatAttachment | null;
};

type DirectConversationInput = {
  roomId: string;
  currentUserId: string;
  peerUserId: string;
};

type SendDirectMessageInput = DirectConversationInput & {
  authorName: string;
  authorAvatar: string | null;
  peerName: string;
  peerAvatar: string | null;
  content: string;
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

function directThreadId(currentUserId: string, peerUserId: string) {
  return [currentUserId, peerUserId].sort().join("__");
}

function directThreadDocument(input: DirectConversationInput) {
  return doc(roomDocument(input.roomId), "directThreads", directThreadId(input.currentUserId, input.peerUserId));
}

function directMessagesCollection(input: DirectConversationInput) {
  return collection(directThreadDocument(input), "messages");
}

function notificationsCollection() {
  return collection(getClientFirestore(), collections.notifications);
}

async function tryCreateRoomNotification(input: RoomNotificationInput) {
  const userId = sanitizeText(input.userId, 120);
  const roomId = normalizeRoomCode(input.roomId);
  const title = sanitizeText(input.title, 120);

  if (!userId || roomId.length !== ROOM_CODE_LENGTH || !title) return;

  try {
    await addDoc(notificationsCollection(), {
      userId,
      roomId,
      title,
      message: sanitizeText(input.message, 500),
      kind: input.kind,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Notificacoes sao auxiliares; a acao principal da sala nao deve falhar por isso.
  }
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
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const code = await createUniqueRoomCode();
  const name = sanitizeText(input.name, 80) || "Sala de estudos";
  const ownerName = sanitizeText(input.ownerName, 80) || "Estudante";

  await setDoc(roomDocument(code), {
    code,
    name,
    ownerId: input.userId,
    ownerName,
    memberProfiles: [
      {
        userId: input.userId,
        name: ownerName,
        avatar: input.ownerAvatar,
        role: "admin",
        joinedAt: Timestamp.now(),
      },
    ],
    bannedUserIds: [],
    memberIds: [input.userId],
    memberCount: 1,
    pendingRequests: [],
    pendingRequestUserIds: [],
    lastMessageText: "",
    lastMessageAuthorName: "",
    lastMessageAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return code;
}

export async function deletePrivateRoom(roomId: string) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await deleteDoc(roomDocument(roomId));
}

export async function requestJoinPrivateRoom(input: RequestJoinRoomInput): Promise<RequestJoinRoomResult> {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const code = normalizeRoomCode(input.code);

  if (code.length !== ROOM_CODE_LENGTH) {
    throw new Error("Informe um código de sala válido.");
  }

  let status: "already-member" | "pending" | "created" = "created";
  const ownerNotifications: OwnerJoinNotification[] = [];

  await runTransaction(getClientFirestore(), async (transaction) => {
    const roomRef = roomDocument(code);
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      throw new Error("Sala não encontrada. Confira o código ou peça um novo link.");
    }

    const data = snapshot.data();
    const ownerId = String(data.ownerId ?? "");
    const roomName = sanitizeText(String(data.name ?? "Sala"), 80) || "Sala";
    const requesterName = sanitizeText(input.userName, 80) || "Estudante";
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds.map(String) : [];
    const bannedUserIds = Array.isArray(data.bannedUserIds) ? data.bannedUserIds.map(String) : [];
    const pendingRequests = Array.isArray(data.pendingRequests)
      ? data.pendingRequests.map((item) => item as Record<string, unknown>)
      : [];

    if (bannedUserIds.includes(input.userId)) {
      throw new Error("Sua entrada nesta sala foi bloqueada pelo admin.");
    }

    if (memberIds.includes(input.userId)) {
      status = "already-member";
      return;
    }

    if (pendingRequests.some((request) => request.userId === input.userId)) {
      status = "pending";
      return;
    }

    transaction.update(roomRef, {
      pendingRequests: arrayUnion({
        userId: input.userId,
        name: requesterName,
        avatar: input.userAvatar,
        requestedAt: Timestamp.now(),
      }),
      pendingRequestUserIds: arrayUnion(input.userId),
      updatedAt: serverTimestamp(),
    });

    ownerNotifications.push({ ownerId, roomName, requesterName });
  });

  const notificationToOwner = ownerNotifications[0];

  if (notificationToOwner) {
    await tryCreateRoomNotification({
      userId: notificationToOwner.ownerId,
      roomId: code,
      title: "Novo pedido de entrada",
      message: `${notificationToOwner.requesterName} quer entrar na sala ${notificationToOwner.roomName}.`,
      kind: "room",
    });
  }

  return { code, status };
}

export async function approveRoomJoinRequest(input: ReviewJoinRequestInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await reviewRoomJoinRequest(input, "approve");
}

export async function rejectRoomJoinRequest(input: ReviewJoinRequestInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await reviewRoomJoinRequest(input, "reject");
}

export async function updateRoomMemberRole(input: UpdateRoomMemberRoleInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  let roomName = "Sala";

  await runTransaction(getClientFirestore(), async (transaction) => {
    const roomRef = roomDocument(input.roomId);
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) throw new Error("Sala nao encontrada.");

    const data = snapshot.data();
    const ownerId = String(data.ownerId ?? "");
    roomName = sanitizeText(String(data.name ?? "Sala"), 80) || "Sala";

    if (input.memberUserId === ownerId) {
      throw new Error("O admin principal ja possui permissao maxima.");
    }

    const memberProfiles = Array.isArray(data.memberProfiles)
      ? data.memberProfiles.map((item) => item as Record<string, unknown>)
      : [];
    const nextProfiles = memberProfiles.map((member) =>
      member.userId === input.memberUserId ? { ...member, role: input.role } : member,
    );

    transaction.update(roomRef, {
      memberProfiles: nextProfiles,
      updatedAt: serverTimestamp(),
    });
  });

  await tryCreateRoomNotification({
    userId: input.memberUserId,
    roomId: input.roomId,
    title: input.role === "moderator" ? "Voce virou moderador" : "Permissao atualizada",
    message: input.role === "moderator"
      ? `Agora voce pode ajudar na moderacao da sala ${roomName}.`
      : `Sua permissao na sala ${roomName} foi atualizada.`,
    kind: "room",
  });
}

export async function transferRoomOwnership(input: { roomId: string; nextOwner: RoomMemberProfile }) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await runTransaction(getClientFirestore(), async (transaction) => {
    const roomRef = roomDocument(input.roomId);
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) throw new Error("Sala nao encontrada.");

    const data = snapshot.data();
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds.map(String) : [];

    if (!memberIds.includes(input.nextOwner.userId)) {
      throw new Error("Escolha um integrante aprovado.");
    }

    const memberProfiles = Array.isArray(data.memberProfiles)
      ? data.memberProfiles.map((item) => item as Record<string, unknown>)
      : [];
    const nextProfiles = memberProfiles.map((member) => ({
      ...member,
      role: member.userId === input.nextOwner.userId ? "admin" : member.role,
    }));

    transaction.update(roomRef, {
      ownerId: input.nextOwner.userId,
      ownerName: sanitizeText(input.nextOwner.name, 80) || "Estudante",
      memberProfiles: nextProfiles,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function removeRoomMember(input: RemoveRoomMemberInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  let roomName = "Sala";

  await runTransaction(getClientFirestore(), async (transaction) => {
    const roomRef = roomDocument(input.roomId);
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) throw new Error("Sala nao encontrada.");

    const data = snapshot.data();
    roomName = sanitizeText(String(data.name ?? "Sala"), 80) || "Sala";
    const ownerId = String(data.ownerId ?? "");
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds.map(String) : [];
    const bannedUserIds = Array.isArray(data.bannedUserIds) ? data.bannedUserIds.map(String) : [];
    const memberProfiles = Array.isArray(data.memberProfiles)
      ? data.memberProfiles.map((item) => item as Record<string, unknown>)
      : [];

    if (input.memberUserId === ownerId) {
      throw new Error("Transfira a administracao antes de remover o admin principal.");
    }

    transaction.update(roomRef, {
      memberIds: memberIds.filter((userId) => userId !== input.memberUserId),
      memberProfiles: memberProfiles.filter((member) => member.userId !== input.memberUserId),
      memberCount: Math.max(1, memberIds.filter((userId) => userId !== input.memberUserId).length),
      ...(input.ban ? { bannedUserIds: Array.from(new Set([...bannedUserIds, input.memberUserId])) } : {}),
      updatedAt: serverTimestamp(),
    });
  });

  await tryCreateRoomNotification({
    userId: input.memberUserId,
    roomId: input.roomId,
    title: input.ban ? "Acesso bloqueado" : "Voce foi removido",
    message: input.ban ? `Seu acesso a sala ${roomName} foi bloqueado.` : `Voce saiu da sala ${roomName}.`,
    kind: "room",
  });
}

async function reviewRoomJoinRequest(input: ReviewJoinRequestInput, action: "approve" | "reject") {
  const notifications: RequestReviewNotification[] = [];

  await runTransaction(getClientFirestore(), async (transaction) => {
    const roomRef = roomDocument(input.roomId);
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      throw new Error("Sala não encontrada.");
    }

    const data = snapshot.data();
    const roomName = sanitizeText(String(data.name ?? "Sala"), 80) || "Sala";
    const pendingRequests = Array.isArray(data.pendingRequests)
      ? data.pendingRequests.map((item) => item as Record<string, unknown>)
      : [];
    const pendingRequestUserIds = Array.isArray(data.pendingRequestUserIds)
      ? data.pendingRequestUserIds.map(String)
      : [];
    const request = pendingRequests.find((item) => item.userId === input.requestUserId);

    if (!request) return;

    notifications.push({ userId: input.requestUserId, roomName });

    const nextPendingRequests = pendingRequests.filter((item) => item.userId !== input.requestUserId);
    const nextPendingRequestUserIds = pendingRequestUserIds.filter((userId) => userId !== input.requestUserId);
    transaction.update(roomRef, {
      pendingRequests: nextPendingRequests,
      pendingRequestUserIds: nextPendingRequestUserIds,
      ...(action === "approve"
        ? {
            memberIds: arrayUnion(input.requestUserId),
            memberProfiles: arrayUnion({
              userId: input.requestUserId,
              name: sanitizeText(String(request.name ?? ""), 80) || "Estudante",
              avatar: typeof request.avatar === "string" ? request.avatar : null,
              role: "member",
              joinedAt: Timestamp.now(),
            }),
            memberCount: increment(1),
          }
        : {}),
      updatedAt: serverTimestamp(),
    });
  });

  const notificationToRequester = notifications[0];

  if (notificationToRequester) {
    await tryCreateRoomNotification({
      userId: notificationToRequester.userId,
      roomId: input.roomId,
      title: action === "approve" ? "Entrada aprovada" : "Pedido recusado",
      message: action === "approve"
        ? `Voce ja pode entrar na sala ${notificationToRequester.roomName}.`
        : `Seu pedido para entrar na sala ${notificationToRequester.roomName} foi recusado.`,
      kind: "room",
    });
  }
}

export function listenRoomDirectMessages(
  input: DirectConversationInput,
  onData: (messages: RoomDirectMessage[]) => void,
  onError: (error: Error) => void,
  resultLimit = 80,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const messagesQuery = query(directMessagesCollection(input), orderBy("createdAt", "desc"), limit(resultLimit));

  return onSnapshot(
    messagesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapDirectMessage(item.id, item.data())).reverse()),
    onError,
  );
}

export async function sendRoomDirectMessage(input: SendDirectMessageInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const content = sanitizeText(input.content, 1000);

  if (!content) {
    throw new Error("Escreva uma mensagem privada.");
  }

  const authorName = sanitizeText(input.authorName, 80) || "Estudante";
  const peerName = sanitizeText(input.peerName, 80) || "Integrante";
  const threadRef = directThreadDocument(input);
  const participantIds = [input.currentUserId, input.peerUserId].sort();

  await setDoc(
    threadRef,
    {
      participantIds,
      participantNames: {
        [input.currentUserId]: authorName,
        [input.peerUserId]: peerName,
      },
      participantAvatars: {
        [input.currentUserId]: input.authorAvatar,
        [input.peerUserId]: input.peerAvatar,
      },
      lastMessageText: content,
      lastMessageAuthorName: authorName,
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await addDoc(directMessagesCollection(input), {
    userId: input.currentUserId,
    authorName,
    authorAvatar: input.authorAvatar,
    content,
    createdAt: serverTimestamp(),
  });
}

export function listenUserRooms(
  userId: string,
  onData: (rooms: PrivateRoom[]) => void,
  onError: (error: Error) => void,
  resultLimit = 30,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

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

export function listenRoomAccess(
  roomId: string,
  userId: string,
  onData: (hasAccess: boolean) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData(false);
    return () => undefined;
  }

  return onSnapshot(
    roomDocument(roomId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(false);
        return;
      }

      const memberIds = Array.isArray(snapshot.data().memberIds) ? snapshot.data().memberIds.map(String) : [];
      onData(memberIds.includes(userId));
    },
    onError,
  );
}

export function listenRoomMessages(
  roomId: string,
  onData: (messages: RoomMessage[]) => void,
  onError: (error: Error) => void,
  resultLimit = 80,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const messagesQuery = query(roomMessagesCollection(roomId), orderBy("createdAt", "desc"), limit(resultLimit));

  return onSnapshot(
    messagesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapRoomMessage(item.id, item.data())).reverse()),
    onError,
  );
}

export async function sendRoomMessage(roomId: string, input: SendRoomMessageInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

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
  const ownerId = String(data.ownerId ?? "");
  const ownerName = String(data.ownerName ?? "Estudante");
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds.map(String) : [];

  return {
    id,
    code: String(data.code ?? id),
    name: String(data.name ?? "Sala de estudos"),
    ownerId,
    ownerName,
    bannedUserIds: Array.isArray(data.bannedUserIds) ? data.bannedUserIds.map(String) : [],
    memberIds,
    memberProfiles: mapMemberProfiles(data.memberProfiles, memberIds, ownerId, ownerName),
    memberCount: Number(data.memberCount ?? 1),
    pendingRequests: Array.isArray(data.pendingRequests) ? data.pendingRequests.map(mapJoinRequest) : [],
    lastMessageText: String(data.lastMessageText ?? ""),
    lastMessageAuthorName: String(data.lastMessageAuthorName ?? ""),
    lastMessageAt: toDate(data.lastMessageAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapMemberProfiles(value: unknown, memberIds: string[], ownerId: string, ownerName: string): RoomMemberProfile[] {
  const profiles = Array.isArray(value) ? value.map(mapMemberProfile).filter((member) => member.userId) : [];
  const membersById = new Map(profiles.map((member) => [member.userId, member]));

  if (ownerId && !membersById.has(ownerId)) {
    membersById.set(ownerId, {
      userId: ownerId,
      name: ownerName,
      avatar: null,
      role: "admin",
      joinedAt: null,
    });
  }

  memberIds.forEach((userId) => {
    if (!membersById.has(userId)) {
      membersById.set(userId, {
        userId,
        name: userId === ownerId ? ownerName : "Integrante",
        avatar: null,
        role: userId === ownerId ? "admin" : "member",
        joinedAt: null,
      });
    }
  });

  return Array.from(membersById.values()).sort((left, right) => {
    if (left.role !== right.role) return left.role === "admin" ? -1 : 1;

    return left.name.localeCompare(right.name);
  });
}

function mapMemberProfile(data: unknown): RoomMemberProfile {
  const member = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    userId: String(member.userId ?? ""),
    name: String(member.name ?? "Integrante"),
    avatar: typeof member.avatar === "string" ? member.avatar : null,
    role: member.role === "admin" || member.role === "moderator" ? member.role : "member",
    joinedAt: toDate(member.joinedAt),
  };
}

function mapJoinRequest(data: unknown): RoomJoinRequest {
  const request = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    userId: String(request.userId ?? ""),
    name: String(request.name ?? "Estudante"),
    avatar: typeof request.avatar === "string" ? request.avatar : null,
    requestedAt: toDate(request.requestedAt),
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

function mapDirectMessage(id: string, data: Record<string, unknown>): RoomDirectMessage {
  return {
    id,
    userId: String(data.userId),
    authorName: String(data.authorName ?? "Estudante"),
    authorAvatar: typeof data.authorAvatar === "string" ? data.authorAvatar : null,
    content: String(data.content ?? ""),
    createdAt: toDate(data.createdAt),
  };
}
