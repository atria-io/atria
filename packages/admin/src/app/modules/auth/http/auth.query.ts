import type { ProviderId } from "../../../../types/auth.js";

export interface AuthQueryState {
  provider: ProviderId | null;
  brokerCode: string | null;
  brokerConsentToken: string | null;
  brokerProjectId: string | null;
  nextPath: string;
}

/**
 * Canonical parser for auth query state consumed by bootstrap and redirect hooks.
 * Invalid provider/next values are normalized to safe defaults to keep auth flow deterministic.
 *
 * @param {string} search
 * @returns {AuthQueryState}
 */
export const readAuthQueryState = (search: string): AuthQueryState => {
  const params = new URLSearchParams(search);
  const providerValue = params.get("provider");
  const provider =
    providerValue === "google" || providerValue === "github" || providerValue === "email"
      ? providerValue
      : null;

  const brokerCode = params.get("broker_code");
  const brokerConsentToken = params.get("code") ?? params.get("broker_consent_token");
  const brokerProjectId = params.get("project_id");
  const nextPath = params.get("next");

  return {
    provider,
    brokerCode: brokerCode || null,
    brokerConsentToken: brokerConsentToken || null,
    brokerProjectId: brokerProjectId || null,
    nextPath: nextPath && nextPath.startsWith("/") ? nextPath : "/"
  };
};
