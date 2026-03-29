export type AdminBootstrapState = "setup" | "create" | "login" | "authenticated";

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
