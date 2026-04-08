export type StudioState =
  | "dashboard";

export interface StudioAppState {
  realm: "studio";
  screen: StudioState;
  user: AppUser;
}

export interface AppUser {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}
