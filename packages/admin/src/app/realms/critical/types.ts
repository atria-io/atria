export type State =
  | "critical"
  | "offline"
  | "server-down";

export interface AppState {
  realm: "critical";
  screen: State;
}

export interface Props {
  state: State;
}
