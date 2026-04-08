import type { AuthScreen as RuntimeAuthScreen } from "../runtime/auth/Auth.types.js";
import type { CriticalScreen as RuntimeCriticalScreen } from "../runtime/critical/Critical.types.js";
import type { StudioScreen as RuntimeStudioScreen } from "../runtime/studio/Studio.types.js";

export type CriticalScreen = RuntimeCriticalScreen;
export type AuthScreen = RuntimeAuthScreen;
export type StudioScreen = RuntimeStudioScreen;

export interface AppUser {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface CriticalAppState {
  realm: "critical";
  screen: CriticalScreen;
}

export interface AuthAppState {
  realm: "auth";
  screen: AuthScreen;
}

export interface StudioAppState {
  realm: "studio";
  screen: StudioScreen;
  user: AppUser;
}

export type AppState = CriticalAppState | AuthAppState | StudioAppState;
