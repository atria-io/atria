export type AuthState =
  | "setup"
  | "create"
  | "login"
  | "broker-consent";

export interface AuthAppState {
  realm: "auth";
  screen: AuthState;
}

export interface AuthProps {
  state: AuthState;
}
