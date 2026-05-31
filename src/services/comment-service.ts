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
import { createActivityLog } from "@/services/activity-service";
import type { Comment } from "@/types/comment";
import { toDate } from "@/utils/date";

export async function createComment(input: {
  userId: string;
  uploadId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
}) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await addDoc(collection(getClientFirestore(), collections.comments), {
    ...input,
    content: sanitizeText(input.content, 1000),
    createdAt: serverTimestamp(),
  });
  await createActivityLog({
    userId: input.userId,
    type: "comment_created",
    message: "Um comentário foi publicado.",
    uploadId: input.uploadId,
  });
}

export function listenComments(
  uploadId: string,
  onData: (comments: Comment[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const commentsQuery = query(
    collection(getClientFirestore(), collections.comments),
    where("uploadId", "==", uploadId),
    orderBy("createdAt", "desc"),
    limit(30),
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            userId: data.userId,
            uploadId: data.uploadId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar ?? null,
            content: data.content,
            createdAt: toDate(data.createdAt),
          };
        }),
      );
    },
    onError,
  );
}
