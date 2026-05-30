export interface Comment {
  id: string;
  userId: string;
  uploadId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: Date | null;
}
