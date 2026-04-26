export type AuthState =
  | "setup"
  | "create"
  | "login"
  | "broker-consent";

export type AuthMode = "login" | "create";

export type AuthProvider = "google" | "github";

export interface AuthAppState {
  realm: "auth";
  screen: AuthState;
}

export interface AuthProps {
  state: AuthState;
}

export interface LoginValues {
  email: string;
  password: string;
}

export interface CreateOwnerValues {
  name: string;
  email: string;
  password: string;
}

export interface BrokerConsentPayload {
  provider: string;
  project_id: string;
  broker_consent_token: string;
  broker_code: string;
}
