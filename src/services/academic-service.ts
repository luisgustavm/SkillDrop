"use client";

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import { sanitizeText } from "@/lib/sanitize";
import { createActivityLog } from "@/services/activity-service";
import { normalizeRoomCode } from "@/services/room-service";
import type {
  NotificationKind,
  RoomEvent,
  RoomEventKind,
  RoomSubject,
  RoomSubjectColor,
  RoomTask,
  RoomTaskStatus,
  SkillDropNotification,
} from "@/types/academic";
import { toDate } from "@/utils/date";

type CreateSubjectInput = {
  roomId: string;
  userId: string;
  name: string;
  color: RoomSubjectColor;
};

type CreateTaskInput = {
  roomId: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  description: string;
  dueAt?: Date | null;
};

type CreateEventInput = {
  roomId: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  description: string;
  startsAt?: Date | null;
  kind: RoomEventKind;
};

function scopedRoomId(roomId: string) {
  const normalized = normalizeRoomCode(roomId);
  if (normalized.length !== 8) throw new Error("Sala invalida.");

  return normalized;
}

function toTimestamp(value?: Date | null) {
  return value ? Timestamp.fromDate(value) : null;
}

export async function createRoomSubject(input: CreateSubjectInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = scopedRoomId(input.roomId);
  const name = sanitizeText(input.name, 80);

  if (!name) throw new Error("Informe o nome da disciplina.");

  await addDoc(collection(getClientFirestore(), collections.roomSubjects), {
    roomId,
    name,
    color: input.color,
    createdBy: input.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createActivityLog({
    userId: input.userId,
    roomId,
    type: "subject_created",
    message: `Disciplina criada: ${name}.`,
  });
}

export async function createRoomTask(input: CreateTaskInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = scopedRoomId(input.roomId);
  const title = sanitizeText(input.title, 120);

  if (!title) throw new Error("Informe o titulo da atividade.");

  await addDoc(collection(getClientFirestore(), collections.roomTasks), {
    roomId,
    subjectId: input.subjectId ?? null,
    title,
    description: sanitizeText(input.description, 1000),
    dueAt: toTimestamp(input.dueAt),
    status: "open",
    createdBy: input.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createActivityLog({
    userId: input.userId,
    roomId,
    type: "task_created",
    message: `Atividade criada: ${title}.`,
  });
}

export async function updateRoomTaskStatus(taskId: string, status: RoomTaskStatus) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await updateDoc(doc(getClientFirestore(), collections.roomTasks, taskId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function createRoomEvent(input: CreateEventInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = scopedRoomId(input.roomId);
  const title = sanitizeText(input.title, 120);

  if (!title) throw new Error("Informe o titulo do evento.");

  await addDoc(collection(getClientFirestore(), collections.roomEvents), {
    roomId,
    subjectId: input.subjectId ?? null,
    title,
    description: sanitizeText(input.description, 1000),
    startsAt: toTimestamp(input.startsAt),
    kind: input.kind,
    createdBy: input.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createActivityLog({
    userId: input.userId,
    roomId,
    type: "event_created",
    message: `Evento criado: ${title}.`,
  });
}

export async function createNotification(input: {
  userId: string;
  roomId?: string | null;
  title: string;
  message: string;
  kind: NotificationKind;
}) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await addDoc(collection(getClientFirestore(), collections.notifications), {
    userId: input.userId,
    roomId: input.roomId ?? null,
    title: sanitizeText(input.title, 120),
    message: sanitizeText(input.message, 500),
    kind: input.kind,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function listenRoomSubjects(roomId: string, onData: (subjects: RoomSubject[]) => void, onError: (error: Error) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const subjectsQuery = query(
    collection(getClientFirestore(), collections.roomSubjects),
    where("roomId", "==", scopedRoomId(roomId)),
    orderBy("createdAt", "desc"),
    limit(40),
  );

  return onSnapshot(subjectsQuery, (snapshot) => onData(snapshot.docs.map((item) => mapSubject(item.id, item.data()))), onError);
}

export function listenRoomTasks(roomId: string, onData: (tasks: RoomTask[]) => void, onError: (error: Error) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const tasksQuery = query(
    collection(getClientFirestore(), collections.roomTasks),
    where("roomId", "==", scopedRoomId(roomId)),
    orderBy("createdAt", "desc"),
    limit(80),
  );

  return onSnapshot(tasksQuery, (snapshot) => onData(snapshot.docs.map((item) => mapTask(item.id, item.data()))), onError);
}

export function listenRoomEvents(roomId: string, onData: (events: RoomEvent[]) => void, onError: (error: Error) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const eventsQuery = query(
    collection(getClientFirestore(), collections.roomEvents),
    where("roomId", "==", scopedRoomId(roomId)),
    orderBy("startsAt", "asc"),
    limit(60),
  );

  return onSnapshot(eventsQuery, (snapshot) => onData(snapshot.docs.map((item) => mapEvent(item.id, item.data()))), onError);
}

export function listenUserNotifications(
  userId: string,
  onData: (notifications: SkillDropNotification[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const notificationsQuery = query(
    collection(getClientFirestore(), collections.notifications),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapNotification(item.id, item.data()))),
    onError,
  );
}

export async function markNotificationRead(notificationId: string) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await updateDoc(doc(getClientFirestore(), collections.notifications, notificationId), { read: true });
}

function mapSubject(id: string, data: Record<string, unknown>): RoomSubject {
  return {
    id,
    roomId: String(data.roomId ?? ""),
    name: String(data.name ?? "Disciplina"),
    color: String(data.color ?? "blue") as RoomSubjectColor,
    createdBy: String(data.createdBy ?? ""),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapTask(id: string, data: Record<string, unknown>): RoomTask {
  return {
    id,
    roomId: String(data.roomId ?? ""),
    subjectId: typeof data.subjectId === "string" ? data.subjectId : null,
    title: String(data.title ?? "Atividade"),
    description: String(data.description ?? ""),
    dueAt: toDate(data.dueAt),
    status: data.status === "done" ? "done" : "open",
    createdBy: String(data.createdBy ?? ""),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapEvent(id: string, data: Record<string, unknown>): RoomEvent {
  return {
    id,
    roomId: String(data.roomId ?? ""),
    subjectId: typeof data.subjectId === "string" ? data.subjectId : null,
    title: String(data.title ?? "Evento"),
    description: String(data.description ?? ""),
    startsAt: toDate(data.startsAt),
    kind: String(data.kind ?? "class") as RoomEventKind,
    createdBy: String(data.createdBy ?? ""),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapNotification(id: string, data: Record<string, unknown>): SkillDropNotification {
  return {
    id,
    userId: String(data.userId ?? ""),
    roomId: typeof data.roomId === "string" ? data.roomId : null,
    title: String(data.title ?? "Notificacao"),
    message: String(data.message ?? ""),
    kind: String(data.kind ?? "room") as NotificationKind,
    read: Boolean(data.read),
    createdAt: toDate(data.createdAt),
  };
}
