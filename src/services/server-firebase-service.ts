import { collections } from "@/firebase/collections";
import { getAdminAuth, getAdminFirestore } from "@/firebase/admin";
import { firebaseClientConfig } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

type FirestoreValue = {
  stringValue?: string;
  arrayValue?: {
    values?: FirestoreValue[];
  };
};

type VerifiedRequestUser = {
  idToken: string;
  uid: string;
};

function hasAdminCredentials() {
  return Boolean(serverEnv.firebaseProjectId && serverEnv.firebaseClientEmail && serverEnv.firebasePrivateKey);
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function getProjectId() {
  const projectId = serverEnv.firebaseProjectId ?? firebaseClientConfig.projectId;

  if (!projectId) {
    throw new Error("Firebase Project ID nao esta configurado no servidor.");
  }

  return projectId;
}

function getFirebaseApiKey() {
  if (!firebaseClientConfig.apiKey) {
    throw new Error("Firebase API Key nao esta configurada no servidor.");
  }

  return firebaseClientConfig.apiKey;
}

function getStringField(document: FirestoreDocument, field: string) {
  return document.fields?.[field]?.stringValue ?? "";
}

function getStringArrayField(document: FirestoreDocument, field: string) {
  return document.fields?.[field]?.arrayValue?.values?.map((value) => value.stringValue ?? "").filter(Boolean) ?? [];
}

async function fetchFirestoreDocument(path: string, idToken: string): Promise<FirestoreDocument | null> {
  const projectId = getProjectId();
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Nao foi possivel validar os dados no Firestore.");
  }

  return (await response.json()) as FirestoreDocument;
}

export async function getVerifiedRequestUser(request: Request): Promise<VerifiedRequestUser> {
  const idToken = getBearerToken(request) || getCookieValue(request, "skilldrop_id_token");

  if (!idToken) {
    throw new Error("Entre na sua conta para continuar.");
  }

  if (hasAdminCredentials()) {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);

    return { idToken, uid: decodedToken.uid };
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${getFirebaseApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const body = (await response.json().catch(() => null)) as { users?: Array<{ localId?: string }>; error?: { message?: string } } | null;
  const uid = body?.users?.[0]?.localId;

  if (!response.ok || !uid) {
    throw new Error("Sessao expirada. Entre novamente para continuar.");
  }

  return { idToken, uid };
}

export async function assertServerRoomMember(roomId: string, user: VerifiedRequestUser) {
  if (hasAdminCredentials()) {
    const snapshot = await getAdminFirestore().collection(collections.rooms).doc(roomId).get();

    if (!snapshot.exists) {
      throw new Error("Sala nao encontrada.");
    }

    const memberIds = Array.isArray(snapshot.data()?.memberIds) ? snapshot.data()?.memberIds.map(String) : [];

    if (!memberIds.includes(user.uid)) {
      throw new Error("Voce precisa ser integrante da sala para enviar arquivos.");
    }

    return;
  }

  const room = await fetchFirestoreDocument(`${collections.rooms}/${encodeURIComponent(roomId)}`, user.idToken);

  if (!room) {
    throw new Error("Sala nao encontrada.");
  }

  if (!getStringArrayField(room, "memberIds").includes(user.uid)) {
    throw new Error("Voce precisa ser integrante da sala para enviar arquivos.");
  }
}

export async function getServerUploadOwnerAndUrl(uploadId: string, user: VerifiedRequestUser) {
  if (hasAdminCredentials()) {
    const snapshot = await getAdminFirestore().collection(collections.uploads).doc(uploadId).get();

    if (!snapshot.exists) return null;

    const data = snapshot.data();

    return {
      fileUrl: typeof data?.fileUrl === "string" ? data.fileUrl : "",
      storageProvider: typeof data?.storageProvider === "string" ? data.storageProvider : "",
      userId: typeof data?.userId === "string" ? data.userId : "",
    };
  }

  const upload = await fetchFirestoreDocument(`${collections.uploads}/${encodeURIComponent(uploadId)}`, user.idToken);

  if (!upload) return null;

  return {
    fileUrl: getStringField(upload, "fileUrl"),
    storageProvider: getStringField(upload, "storageProvider"),
    userId: getStringField(upload, "userId"),
  };
}
