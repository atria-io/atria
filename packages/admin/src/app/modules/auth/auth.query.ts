import type { ProviderId } from "../../../types/auth.js";

export interface AuthQueryState {
  provider: ProviderId | null;
  brokerCode: string | null;
  nextPath: string;
}

const parseProvider = (value: string | null): ProviderId | null => {
  if (value === "google" || value === "github" || value === "email") {
    return value;
  }

  return null;
};

export const readAuthQueryState = (search: string): AuthQueryState => {
  const params = new URLSearchParams(search);
  const brokerCode = params.get("broker_code");
  const nextPath = params.get("next");

  return {
    provider: parseProvider(params.get("provider")),
    brokerCode: brokerCode && brokerCode.length > 0 ? brokerCode : null,
    nextPath: nextPath && nextPath.startsWith("/") ? nextPath : "/"
  };
};
