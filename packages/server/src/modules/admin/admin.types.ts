export type AdminBootstrapState = "setup" | "create" | "login" | "authenticated";

export interface AdminBootstrapResponse {
  state: AdminBootstrapState;
}
