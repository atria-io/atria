import type { Props } from "./types.js";
import { SetupView } from "./screen/states/setup/SetupView.js";
import { SignInView } from "./screen/states/signin/SignInView.js";
import { CreateView } from "./screen/states/create/CreateView.js";
import { BrokerView } from "./screen/states/broker/BrokerView.js";

export const Screen = (
  { state }: Props
) => {
  switch (state) {
    case "setup":
      return <SetupView />;
    case "create":
      return <CreateView />;
    case "sign-in":
      return <SignInView />;
    case "broker-consent":
      return <BrokerView />;
  }
};
