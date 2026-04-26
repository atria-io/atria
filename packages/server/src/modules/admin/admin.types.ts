export type AdminBootstrapState =
  | "setup"
  | "create"
  | "sign-in"
  | "broker-consent"
  | "authenticated";

export interface AdminBootstrapUserSummary {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface AdminBootstrapResponse {
  state: AdminBootstrapState;
  user?: AdminBootstrapUserSummary;
}
