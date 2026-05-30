export type ActivityType = "upload_created" | "upload_shared" | "favorite_added" | "comment_created" | "ai_message";

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  message: string;
  uploadId?: string;
  createdAt: Date | null;
}
