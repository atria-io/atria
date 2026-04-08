export type AuthState = "setup" | "create" | "login" | "broker-consent";

export interface AuthProps {
  state: AuthState;
}
