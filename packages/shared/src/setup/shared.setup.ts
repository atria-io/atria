import type { AuthMethod } from "../auth/shared.auth.js";

export interface OwnerSetupState {
  pending: boolean;
  preferredAuthMethod: AuthMethod | null;
}
