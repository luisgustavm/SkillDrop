"use client";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import { createActivityLog } from "@/services/activity-service";
import type { Favorite } from "@/types/favorite";
import { toDate } from "@/utils/date";

function favoriteDocumentId(userId: string, uploadId: string) {
  return `${userId}_${uploadId}`;
}

export async function setFavorite(userId: string, uploadId: string, enabled: boolean, roomId?: string | null) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const db = getClientFirestore();
  const favoriteRef = doc(db, collections.favorites, favoriteDocumentId(userId, uploadId));

  if (!enabled) {
    await deleteDoc(favoriteRef);
    return;
  }

  await setDoc(favoriteRef, {
    userId,
    uploadId,
    createdAt: serverTimestamp(),
  });
  await createActivityLog({
    userId,
    roomId,
    type: "favorite_added",
    message: "Um envio foi adicionado aos favoritos.",
    uploadId,
  });
}

export function listenFavorites(
  userId: string,
  onData: (favorites: Favorite[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const favoritesQuery = query(
    collection(getClientFirestore(), collections.favorites),
    where("userId", "==", userId),
  );

  return onSnapshot(
    favoritesQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            userId: data.userId,
            uploadId: data.uploadId,
            createdAt: toDate(data.createdAt),
          };
        }),
      );
    },
    onError,
  );
}
