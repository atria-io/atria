import type { AppState } from "@/system/appState.js";
import type { AuthState } from "@/runtime/auth/AuthTypes.js";

const hasBrokerConsentQueryMarker = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URL(window.location.href).searchParams;
  const screen = params.get("screen");
  if (screen === "broker-consent" || screen === "consent") {
    return true;
  }

  return (
    params.get("code") !== null ||
    params.get("broker_consent_token") !== null ||
    params.get("broker_code") !== null
  );
};

export const resolveAuthState = (screen: AuthState): AppState => {
  if (hasBrokerConsentQueryMarker()) {
    return { realm: "auth", screen: "broker-consent" };
  }

  return { realm: "auth", screen };
};
