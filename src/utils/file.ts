import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import type { FileKind } from "@/types/upload";

export function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function classifyFile(file: Pick<File, "name" | "type">): FileKind {
  const extension = getFileExtension(file.name);

  if (file.type.includes("pdf") || extension === "pdf") return "pdf";
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg"].includes(extension)) return "image";
  if (file.type.startsWith("video/") || extension === "mp4") return "video";
  if (["zip"].includes(extension)) return "archive";
  if (["doc", "docx"].includes(extension)) return "document";
  if (["txt", "md"].includes(extension)) return "text";
  if (["js", "jsx", "ts", "tsx", "py", "java", "cs", "html", "css", "sql", "json"].includes(extension)) {
    return "code";
  }

  return "other";
}

export function validateUploadFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `Formato .${extension || "desconhecido"} não é aceito.`;
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "O arquivo excede o limite de 100 MB.";
  }

  return null;
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getLanguageFromFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cs: "csharp",
    html: "html",
    css: "css",
    sql: "sql",
    json: "json",
    md: "markdown",
  };

  return map[extension] ?? "plaintext";
}
