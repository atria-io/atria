export type CriticalState =
  | "critical"
  | "offline"
  | "server-down";

export interface CriticalAppState {
  realm: "critical";
  screen: CriticalState;
}

export interface CriticalProps {
  state: CriticalState;
}
