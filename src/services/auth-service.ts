"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getClientAuth, waitForAuthPersistence } from "@/firebase/client";

async function getReadyAuth() {
  const auth = getClientAuth();
  await waitForAuthPersistence();

  return auth;
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(await getReadyAuth(), email, password);

  return credential.user;
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(await getReadyAuth(), email, password);
  await updateProfile(credential.user, { displayName: name });

  return credential.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(await getReadyAuth(), provider);

  return credential.user;
}

export async function loginAsGuest() {
  const credential = await signInAnonymously(await getReadyAuth());

  return credential.user;
}

export async function recoverPassword(email: string) {
  await sendPasswordResetEmail(await getReadyAuth(), email);
}

export async function logoutUser() {
  await signOut(await getReadyAuth());
}
