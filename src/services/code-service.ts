"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { collections } from "@/firebase/collections";
import { getClientFirestore, getFirebaseConfigError, isFirebaseConfigured } from "@/firebase/client";
import { sanitizeText } from "@/lib/sanitize";
import type { CodeLanguage, CodeSnippet, SaveCodeSnippetInput } from "@/types/code";
import { toDate } from "@/utils/date";

const allowedLanguages = new Set<CodeLanguage>([
  "javascript",
  "typescript",
  "python",
  "java",
  "csharp",
  "html",
  "css",
  "sql",
]);

function normalizeCodeInput(input: SaveCodeSnippetInput) {
  const title = sanitizeText(input.title, 120);
  const code = sanitizeText(input.code, 50_000);

  if (!title) throw new Error("Coloque um título para salvar o código.");
  if (!code) throw new Error("Escreva um código antes de salvar.");
  if (!allowedLanguages.has(input.language)) throw new Error("Linguagem inválida.");

  return {
    userId: input.userId,
    authorName: sanitizeText(input.authorName, 80) || "Estudante",
    authorAvatar: input.authorAvatar,
    title,
    language: input.language,
    extension: sanitizeText(input.extension, 12),
    code,
  };
}

export async function createCodeSnippet(input: SaveCodeSnippetInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const payload = normalizeCodeInput(input);

  const snippetRef = await addDoc(collection(getClientFirestore(), collections.codeSnippets), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return snippetRef.id;
}

export async function updateCodeSnippet(snippetId: string, input: SaveCodeSnippetInput) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  const payload = normalizeCodeInput(input);

  await updateDoc(doc(getClientFirestore(), collections.codeSnippets, snippetId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCodeSnippet(snippetId: string) {
  if (!isFirebaseConfigured) throw getFirebaseConfigError();

  await deleteDoc(doc(getClientFirestore(), collections.codeSnippets, snippetId));
}

export function listenCodeSnippets(
  onData: (snippets: CodeSnippet[]) => void,
  onError: (error: Error) => void,
  resultLimit = 80,
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onData([]);
    return () => undefined;
  }

  const snippetsQuery = query(
    collection(getClientFirestore(), collections.codeSnippets),
    orderBy("createdAt", "desc"),
    limit(resultLimit),
  );

  return onSnapshot(
    snippetsQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            userId: String(data.userId),
            authorName: String(data.authorName ?? "Estudante"),
            authorAvatar: typeof data.authorAvatar === "string" ? data.authorAvatar : null,
            title: String(data.title ?? "Código sem título"),
            language: (allowedLanguages.has(data.language) ? data.language : "typescript") as CodeLanguage,
            extension: String(data.extension ?? "ts"),
            code: String(data.code ?? ""),
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          };
        }),
      );
    },
    onError,
  );
}
