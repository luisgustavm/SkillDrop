export type AuthProviderId = "password" | "google.com" | "anonymous";
export type AccountStatus = "active" | "inactive" | "deleted";

export interface SkillDropUser {
  uid: string;
  name: string;
  email: string | null;
  avatar: string | null;
  provider: AuthProviderId;
  isAnonymous: boolean;
  accountStatus: AccountStatus;
  deactivatedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
