import type { AuthState } from "./auth.types.js";
import { SetupView } from "./views/SetupView.js";
import { CreateOwnerView } from "./views/CreateOwnerView.js";
import { BrokerConsentView } from "./views/BrokerConsentView.js";
import { LoginView } from "./views/LoginView.js";

export interface AuthProps {
  state: AuthState;
}

const hasBrokerConsentMarker = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get("screen") === "broker-consent") {
    return true;
  }

  return (
    url.searchParams.get("broker_consent_token") !== null ||
    url.searchParams.get("broker_code") !== null
  );
};

export const Auth = ({ state }: AuthProps) => {
  if (hasBrokerConsentMarker()) {
    return <BrokerConsentView />;
  }

  switch (state) {
    case "setup":
      return <SetupView />;
    case "create":
      return <CreateOwnerView />;
    case "login":
      return <LoginView />;
    case "broker-consent":
      return <BrokerConsentView />;
  }
};
