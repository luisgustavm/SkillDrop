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
import type { ActivityLog, ActivityType } from "@/types/activity";
import { toDate } from "@/utils/date";

export async function createActivityLog(input: {
  userId: string;
  type: ActivityType;
  message: string;
  uploadId?: string;
}) {
  await addDoc(collection(getClientFirestore(), collections.activityLogs), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export function listenActivities(
  userId: string,
  onData: (activities: ActivityLog[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
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

          return {
            id: item.id,
            userId: data.userId,
            type: data.type,
            message: data.message,
            uploadId: data.uploadId,
            createdAt: toDate(data.createdAt),
          };
        }),
      );
    },
    onError,
  );
}
