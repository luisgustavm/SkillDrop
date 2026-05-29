export type AuthProviderId = "password" | "google.com" | "anonymous";

export interface SkillDropUser {
  uid: string;
  name: string;
  email: string | null;
  avatar: string | null;
  provider: AuthProviderId;
  isAnonymous: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}
