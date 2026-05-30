export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  createdAt: Date | null;
}

export interface AiChatRequestMessage {
  role: ChatRole;
  content: string;
}

export type GlobalChatAttachmentKind = "image" | "file";

export interface GlobalChatAttachment {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  kind: GlobalChatAttachmentKind;
}

export interface GlobalChatMessage {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachment: GlobalChatAttachment | null;
  createdAt: Date | null;
}

export interface PrivateRoom {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  memberIds: string[];
  memberCount: number;
  lastMessageText: string;
  lastMessageAuthorName: string;
  lastMessageAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface RoomMessage {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachment: GlobalChatAttachment | null;
  createdAt: Date | null;
}
