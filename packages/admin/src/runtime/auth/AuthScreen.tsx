import type { AuthProps } from "./AuthTypes.js";
import { SetupView } from "./views/SetupView.js";
import { LoginView } from "./views/LoginView.js";
import { CreateOwnerView } from "./views/CreateOwnerView.js";
import { BrokerConsentView } from "./views/BrokerConsentView.js";

export const AuthScreen = ({ state }: AuthProps) => {
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
