export type RoomSubjectColor = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
export type RoomTaskStatus = "open" | "done";
export type RoomEventKind = "class" | "exam" | "assignment" | "meeting" | "presentation";
export type NotificationKind = "room" | "material" | "task" | "message";

export interface RoomSubject {
  id: string;
  roomId: string;
  name: string;
  color: RoomSubjectColor;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface RoomTask {
  id: string;
  roomId: string;
  subjectId: string | null;
  title: string;
  description: string;
  dueAt: Date | null;
  status: RoomTaskStatus;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface RoomEvent {
  id: string;
  roomId: string;
  subjectId: string | null;
  title: string;
  description: string;
  startsAt: Date | null;
  kind: RoomEventKind;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SkillDropNotification {
  id: string;
  userId: string;
  roomId: string | null;
  title: string;
  message: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: Date | null;
}
