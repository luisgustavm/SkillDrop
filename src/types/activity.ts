export type ActivityType =
  | "upload_created"
  | "upload_shared"
  | "favorite_added"
  | "comment_created"
  | "ai_message"
  | "subject_created"
  | "task_created"
  | "event_created";

export interface ActivityLog {
  id: string;
  userId: string;
  roomId?: string | null;
  type: ActivityType;
  message: string;
  uploadId?: string;
  createdAt: Date | null;
}
