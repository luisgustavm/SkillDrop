"use client";

import { deleteUser, updateProfile as updateFirebaseProfile, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, isFirebaseConfigured } from "@/firebase/client";
import { sanitizeText } from "@/lib/sanitize";
import type { AccountStatus, AuthProviderId, SkillDropUser } from "@/types/user";
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
    snapshot.exists()
      ? payload
      : {
          ...payload,
          accountStatus: "active",
          deactivatedAt: null,
          deletedAt: null,
          createdAt: serverTimestamp(),
        },
    { merge: true },
  );
}

export async function updateUserProfile(user: User, input: { name: string; avatar: string }) {
  if (!isFirebaseConfigured) return;

  const name = sanitizeText(input.name, 80);
  const avatar = input.avatar.trim() || null;

  if (!name) throw new Error("Informe um nome valido.");

  await updateFirebaseProfile(user, { displayName: name, photoURL: avatar });
  await setDoc(
    doc(getClientFirestore(), collections.users, user.uid),
    {
      uid: user.uid,
      name,
      email: user.email,
      avatar,
      provider: getProviderId(user),
      isAnonymous: user.isAnonymous,
      accountStatus: "active",
      deactivatedAt: null,
      deletedAt: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function setUserAccountStatus(user: User, status: Exclude<AccountStatus, "deleted">) {
  if (!isFirebaseConfigured) return;

  await setDoc(
    doc(getClientFirestore(), collections.users, user.uid),
    {
      accountStatus: status,
      deactivatedAt: status === "inactive" ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteUserAccount(user: User) {
  if (!isFirebaseConfigured) return;

  const userRef = doc(getClientFirestore(), collections.users, user.uid);

  await setDoc(
    userRef,
    {
      accountStatus: "deleted",
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  try {
    await deleteUser(user);
  } catch (error) {
    await setDoc(
      userRef,
      {
        accountStatus: "active",
        deletedAt: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    throw error;
  }
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
    accountStatus: mapAccountStatus(data.accountStatus),
    deactivatedAt: toDate(data.deactivatedAt),
    deletedAt: toDate(data.deletedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapAccountStatus(value: unknown): AccountStatus {
  if (value === "inactive" || value === "deleted") return value;

  return "active";
}
