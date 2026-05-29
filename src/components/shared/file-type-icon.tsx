import {
  Archive,
  Code2,
  File,
  FileImage,
  FileText,
  FileVideo,
  Link2,
  type LucideIcon,
} from "lucide-react";
import type { FileKind } from "@/types/upload";
import { cn } from "@/lib/utils";

const iconMap: Record<FileKind, LucideIcon> = {
  pdf: FileText,
  document: FileText,
  archive: Archive,
  image: FileImage,
  video: FileVideo,
  text: FileText,
  code: Code2,
  link: Link2,
  other: File,
};

type FileTypeIconProps = {
  type: FileKind;
  className?: string;
};

export function FileTypeIcon({ type, className }: FileTypeIconProps) {
  const Icon = iconMap[type] ?? File;

  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground", className)}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
