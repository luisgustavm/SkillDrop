export type FileKind =
  | "pdf"
  | "document"
  | "archive"
  | "image"
  | "video"
  | "text"
  | "code"
  | "link"
  | "other";

export type UploadVisibility = "private" | "shared";
export type UploadStorageProvider = "blob" | "browser" | "inline" | "url";

export interface AcademicUpload {
  id: string;
  userId: string;
  roomId: string | null;
  title: string;
  description: string;
  fileUrl: string;
  downloadUrl: string | null;
  storagePath: string;
  storageProvider: UploadStorageProvider;
  localFileId: string | null;
  fileName: string;
  fileType: FileKind;
  mimeType: string;
  size: number;
  tags: string[];
  visibility: UploadVisibility;
  shareId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateUploadInput {
  title: string;
  description: string;
  tags: string[];
  visibility: UploadVisibility;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}
