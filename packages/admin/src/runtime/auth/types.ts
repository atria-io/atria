export type State =
  | "setup"
  | "create"
  | "sign-in"
  | "broker-consent";

export type Mode = "sign-in" | "create";

export type Provider = "google" | "github";

export interface AppState {
  realm: "auth";
  screen: State;
}

export interface Props {
  state: State;
}

export interface SignInValues {
  email: string;
  password: string;
}

export interface CreateOwnerValues {
  firstName: string;
  lastName: string;
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
