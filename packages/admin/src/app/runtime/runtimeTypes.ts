export type CriticalScreen = "critical" | "offline" | "server-down";
export type AuthScreen = "setup" | "create" | "login" | "broker-consent";
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
