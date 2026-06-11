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
import { sanitizeText } from "@/lib/sanitize";
import { normalizeRoomCode } from "@/services/room-service";
import type { ChatMessage, ChatRole } from "@/types/chat";
import { toDate } from "@/utils/date";

export async function saveChatMessage(input: {
  userId: string;
  roomId: string;
  role: ChatRole;
  content: string;
}) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const roomId = normalizeRoomCode(input.roomId);
  if (roomId.length !== 8) throw new Error("Entre em uma sala para conversar com a IA.");

  await addDoc(collection(getClientFirestore(), collections.chats), {
    userId: input.userId,
    roomId,
    role: input.role,
    content: sanitizeText(input.content, 8000),
    createdAt: serverTimestamp(),
  });
}

export function listenChatHistory(
  userId: string,
  roomId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const historyQuery = query(
    collection(getClientFirestore(), collections.chats),
    where("userId", "==", userId),
    where("roomId", "==", normalizeRoomCode(roomId)),
    orderBy("createdAt", "asc"),
    limit(60),
  );

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            userId: data.userId,
            roomId: typeof data.roomId === "string" ? data.roomId : null,
            role: data.role,
            content: data.content,
            createdAt: toDate(data.createdAt),
          };
        }),
      );
    },
    onError,
  );
}
