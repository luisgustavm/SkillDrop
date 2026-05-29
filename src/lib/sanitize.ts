export function sanitizeText(value: string, maxLength = 4000) {
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function sanitizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => sanitizeText(tag, 32).toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  return normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-{2,}/g, "-").slice(0, 120);
}
