"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, isFirebaseConfigured } from "@/firebase/client";
import type { AuthProviderId, SkillDropUser } from "@/types/user";
import { toDate } from "@/utils/date";

function getProviderId(user: User): AuthProviderId {
  if (user.isAnonymous) return "anonymous";

  const providerIds = user.providerData.map((provider) => provider.providerId);
  if (providerIds.includes("google.com")) return "google.com";

  return "password";
}

export async function ensureUserProfile(user: User, displayName?: string) {
  if (!isFirebaseConfigured) return;

  const db = getClientFirestore();
  const userRef = doc(db, collections.users, user.uid);
  const snapshot = await getDoc(userRef);
  const name = displayName ?? user.displayName ?? (user.isAnonymous ? "Convidado SkillDrop" : "Estudante");

  const payload = {
    uid: user.uid,
    name,
    email: user.email,
    avatar: user.photoURL,
    provider: getProviderId(user),
    isAnonymous: user.isAnonymous,
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    userRef,
    snapshot.exists() ? payload : { ...payload, createdAt: serverTimestamp() },
    { merge: true },
  );
}

export async function getUserProfile(uid: string): Promise<SkillDropUser | null> {
  if (!isFirebaseConfigured) return null;

  const snapshot = await getDoc(doc(getClientFirestore(), collections.users, uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    uid: data.uid,
    name: data.name,
    email: data.email ?? null,
    avatar: data.avatar ?? null,
    provider: data.provider,
    isAnonymous: Boolean(data.isAnonymous),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}
