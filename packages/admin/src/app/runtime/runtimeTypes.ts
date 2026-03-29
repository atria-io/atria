import type { BootstrapUserSummary } from "../bootstrap/getBootstrapState.js";
import type { AuthState } from "../../modules/auth/auth.types.js";

export type StudioScreen = "dashboard";

export type CriticalScreen =
  | { kind: "critical"; message: string }
  | { kind: "offline" }
  | { kind: "server-down" };

export interface CriticalAppState {
  realm: "critical";
  screen: CriticalScreen;
}

export interface AuthAppState {
  realm: "auth";
  screen: AuthState;
}

export interface StudioAppState {
  realm: "studio";
  screen: StudioScreen;
  user: BootstrapUserSummary;
}

export type AppState = CriticalAppState | AuthAppState | StudioAppState;
