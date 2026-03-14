export type AuthMode = "create" | "login";
export type ProviderId = "google" | "github" | "email";

export interface SetupStatus {
  pending: boolean;
  preferredAuthMethod: ProviderId | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface SessionPayload {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface ProvidersPayload {
  providers: ProviderId[];
}

export interface BrokerExchangePayload {
  ok: boolean;
}
