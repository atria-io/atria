export type OwnerSetupState = "setup" | "create" | "ready";

export interface AuthOwnerInput {
  email: string;
  password: string;
  name?: string | null;
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

export interface AuthOAuthProfileInput {
  provider: AuthOAuthProvider;
  providerUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export type AuthOAuthProvider = "google" | "github";
