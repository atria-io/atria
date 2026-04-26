import type { AuthProps } from "./AuthTypes.js";
import { SetupView } from "./views/SetupView.js";
import { SignInView } from "./views/SignInView.js";
import { CreateOwnerView } from "./views/CreateOwnerView.js";
import { BrokerConsentView } from "./views/BrokerConsentView.js";

export const AuthScreen = ({ state }: AuthProps) => {
  switch (state) {
    case "setup":
      return <SetupView />;
    case "create":
      return <CreateOwnerView />;
    case "sign-in":
      return <SignInView />;
    case "broker-consent":
      return <BrokerConsentView />;
  }
};
