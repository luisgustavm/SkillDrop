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
import { getClientFirestore, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import { normalizeRoomCode } from "@/services/room-service";
import type { ActivityLog, ActivityType } from "@/types/activity";
import { toDate } from "@/utils/date";

export async function createActivityLog(input: {
  userId: string;
  roomId?: string | null;
  type: ActivityType;
  message: string;
  uploadId?: string;
}) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await addDoc(collection(getClientFirestore(), collections.activityLogs), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export function listenRoomActivities(
  roomId: string,
  onData: (activities: ActivityLog[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const activitiesQuery = query(
    collection(getClientFirestore(), collections.activityLogs),
    where("roomId", "==", normalizeRoomCode(roomId)),
    orderBy("createdAt", "desc"),
    limit(12),
  );

  return onSnapshot(
    activitiesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapActivity(item.id, item.data()))),
    onError,
  );
}

export function listenActivities(
  userId: string,
  onData: (activities: ActivityLog[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const activitiesQuery = query(
    collection(getClientFirestore(), collections.activityLogs),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(12),
  );

  return onSnapshot(
    activitiesQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();

          return mapActivity(item.id, data);
        }),
      );
    },
    onError,
  );
}

function mapActivity(id: string, data: Record<string, unknown>): ActivityLog {
  return {
    id,
    userId: String(data.userId),
    roomId: typeof data.roomId === "string" ? data.roomId : null,
    type: data.type as ActivityType,
    message: String(data.message),
    uploadId: typeof data.uploadId === "string" ? data.uploadId : undefined,
    createdAt: toDate(data.createdAt),
  };
}
