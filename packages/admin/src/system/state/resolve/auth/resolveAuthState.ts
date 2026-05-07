import type { AppState } from "@/system/appState.js";
import type { State } from "@/runtime/auth/types.js";

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

export const resolveState = (
  screen: State
): AppState => {
  if (hasBrokerConsentQueryMarker()) {
    return { realm: "auth", screen: "broker-consent" };
  }

  return { realm: "auth", screen };
};
