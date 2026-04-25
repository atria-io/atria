export interface AppUser {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export type StudioState =
  | "dashboard"
  | "pages"
  | "settings";

export interface StudioAppState {
  realm: "studio";
  screen: StudioState;
  user: AppUser;
}

export interface StudioProps {
  state: StudioState;
}
