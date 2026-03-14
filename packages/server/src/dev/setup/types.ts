import type { AuthMethod } from "@atria/shared";

export interface OwnerSetupState {
  pending: boolean;
  preferredAuthMethod: AuthMethod | null;
}
