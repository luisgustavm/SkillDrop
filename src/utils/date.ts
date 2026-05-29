import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
export function toDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }

  return null;
}

export function formatRelativeDate(value: unknown) {
  const date = toDate(value);
  if (!date) return "agora";

  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}
