import type { ProviderId } from "../../../types/auth.js";

export interface AuthQueryState {
  provider: ProviderId | null;
  brokerCode: string | null;
  nextPath: string;
}

export const readAuthQueryState = (search: string): AuthQueryState => {
  const params = new URLSearchParams(search);
  const providerValue = params.get("provider");
  const provider =
    providerValue === "google" || providerValue === "github" || providerValue === "email"
      ? providerValue
      : null;

  const brokerCode = params.get("broker_code");
  const nextPath = params.get("next");

  return {
    provider,
    brokerCode: brokerCode || null,
    nextPath: nextPath && nextPath.startsWith("/") ? nextPath : "/"
  };
};
