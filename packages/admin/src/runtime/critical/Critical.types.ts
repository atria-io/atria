export type CriticalState =
  | "critical"
  | "offline"
  | "server-down";

export interface CriticalProps {
  state: CriticalState;
}
