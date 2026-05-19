export interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export type State =
  | "dashboard"
  | "pages"
  | "settings";

export interface AppState {
  realm: "studio";
  screen: State;
  user: User;
}

export interface Props {
  state: State;
}
