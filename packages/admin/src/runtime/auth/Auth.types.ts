export type AuthScreen = "setup" | "create" | "login" | "broker-consent";

export interface AuthProps {
  state: AuthScreen;
}
