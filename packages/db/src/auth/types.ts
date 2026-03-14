import type { AuthMethod } from "@atria/shared";

export type OAuthProviderId = "google" | "github";

export interface DatabaseOAuthProfile {
  provider: OAuthProviderId;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}

export interface DatabaseOwnerSetupState {
  pending: boolean;
  preferredAuthMethod: AuthMethod | null;
}
