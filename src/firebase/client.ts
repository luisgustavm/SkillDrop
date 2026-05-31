"use client";

import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseClientConfig, isFirebaseConfigured } from "@/lib/env";

let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;
let authPersistencePromise: Promise<void> | null = null;

export const FIREBASE_CONFIG_ERROR_MESSAGE = "Firebase nao esta configurado. Preencha as variaveis NEXT_PUBLIC_FIREBASE_*.";

export function getFirebaseConfigError() {
  return new Error(FIREBASE_CONFIG_ERROR_MESSAGE);
}

export function getFirebaseClientApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const config = firebaseClientConfig as FirebaseOptions;
  return getApps().length ? getApp() : initializeApp(config);
}

export function getClientAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseClientApp());
    authPersistencePromise = setPersistence(authInstance, browserLocalPersistence);
  }

  return authInstance;
}

export async function waitForAuthPersistence() {
  getClientAuth();
  await authPersistencePromise;
}

export function getClientFirestore() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseClientApp());
  }

  return firestoreInstance;
}

export function getClientStorage() {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseClientApp());
  }

  return storageInstance;
}

export async function getClientAnalytics() {
  if (analyticsInstance || typeof window === "undefined") return analyticsInstance;
  if (!(await isSupported())) return null;

  analyticsInstance = getAnalytics(getFirebaseClientApp());
  return analyticsInstance;
}

export { isFirebaseConfigured };
