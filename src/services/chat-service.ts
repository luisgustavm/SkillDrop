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
import { sanitizeText } from "@/lib/sanitize";
import { createActivityLog } from "@/services/activity-service";
import type { ChatMessage, ChatRole } from "@/types/chat";
import { toDate } from "@/utils/date";

export async function saveChatMessage(input: {
  userId: string;
  role: ChatRole;
  content: string;
}) {
  await addDoc(collection(getClientFirestore(), collections.chats), {
    userId: input.userId,
    role: input.role,
    content: sanitizeText(input.content, 8000),
    createdAt: serverTimestamp(),
  });

  if (input.role === "user") {
    await createActivityLog({
      userId: input.userId,
      type: "ai_message",
      message: "Uma pergunta foi enviada ao assistente.",
    });
  }
}

export function listenChatHistory(
  userId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const historyQuery = query(
    collection(getClientFirestore(), collections.chats),
    where("userId", "==", userId),
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
