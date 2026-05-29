import { cert, getApp, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { serverEnv } from "@/lib/server-env";

function getPrivateKey() {
  return serverEnv.firebasePrivateKey?.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): App {
  if (getApps().length) return getApp();

  const privateKey = getPrivateKey();
  const credential =
    serverEnv.firebaseProjectId && serverEnv.firebaseClientEmail && privateKey
      ? cert({
          projectId: serverEnv.firebaseProjectId,
          clientEmail: serverEnv.firebaseClientEmail,
          privateKey,
        })
      : applicationDefault();

  return initializeApp({
    credential,
    projectId: serverEnv.firebaseProjectId,
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
