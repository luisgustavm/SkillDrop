export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  userId: string;
  roomId: string | null;
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
  memberProfiles: RoomMemberProfile[];
  memberCount: number;
  pendingRequests: RoomJoinRequest[];
  lastMessageText: string;
  lastMessageAuthorName: string;
  lastMessageAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface RoomMemberProfile {
  userId: string;
  name: string;
  avatar: string | null;
  role: "admin" | "member";
  joinedAt: Date | null;
}

export interface RoomJoinRequest {
  userId: string;
  name: string;
  avatar: string | null;
  requestedAt: Date | null;
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

export interface RoomDirectMessage {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: Date | null;
}
