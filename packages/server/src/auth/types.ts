export type OAuthProviderId = "google" | "github";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthIdentity {
  provider: OAuthProviderId;
  providerUserId: string;
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  linkedAt: string;
  updatedAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface OAuthState {
  id: string;
  provider: OAuthProviderId;
  createdAt: string;
  expiresAt: string;
  redirectPath: string;
}

export interface OAuthProfile {
  provider: OAuthProviderId;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}
