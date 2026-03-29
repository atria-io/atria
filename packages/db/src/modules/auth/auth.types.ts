export type OwnerSetupState = "setup" | "create" | "ready";

export interface AuthOwnerInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  password: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: string;
}
