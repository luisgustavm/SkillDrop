export type NotificationKind = "room" | "material" | "message";

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
