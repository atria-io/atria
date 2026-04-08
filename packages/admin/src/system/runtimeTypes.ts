import type { AuthScreen as RuntimeAuthScreen } from "../runtime/auth/Auth.types.js";

export type CriticalScreen = "critical" | "offline" | "server-down";
export type AuthScreen = RuntimeAuthScreen;
export type StudioScreen = "dashboard";

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
