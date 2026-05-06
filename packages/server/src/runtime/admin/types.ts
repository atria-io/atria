export type BootState =
  | "setup"
  | "create"
  | "sign-in"
  | "broker-consent"
  | "authenticated";

export interface BootUser {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface BootPayload {
  state: BootState;
  user?: BootUser;
}
