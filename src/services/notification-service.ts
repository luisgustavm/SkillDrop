"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import type { SkillDropNotification } from "@/types/notification";
import { toDate } from "@/utils/date";

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
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            userId: String(data.userId ?? ""),
            roomId: typeof data.roomId === "string" ? data.roomId : null,
            title: String(data.title ?? "Notificacao"),
            message: String(data.message ?? ""),
            kind: data.kind === "material" || data.kind === "message" ? data.kind : "room",
            read: Boolean(data.read),
            createdAt: toDate(data.createdAt),
          };
        }),
      );
    },
    onError,
  );
}

export async function markNotificationRead(notificationId: string) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await updateDoc(doc(getClientFirestore(), collections.notifications, notificationId), { read: true });
}
