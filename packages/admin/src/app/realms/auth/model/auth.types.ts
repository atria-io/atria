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
