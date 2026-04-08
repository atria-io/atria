import type { AuthState } from "../runtime/auth/Auth.types.js";
import type { CriticalState } from "../runtime/critical/Critical.types.js";
import type { StudioScreen } from "../runtime/studio/Studio.types.js";

export interface AppUser {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface CriticalAppState {
  realm: "critical";
  screen: CriticalState;
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
