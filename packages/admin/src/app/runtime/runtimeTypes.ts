import type { AppUser } from "../state/getAppState.js";
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
  user: AppUser;
}

export type AppState = CriticalAppState | AuthAppState | StudioAppState;
