import type { Props } from "../model/auth.types.js";
import { Setup } from "./setup/index.js";
import { Signin } from "./signin/index.js";
import { Create } from "./create/index.js";
import { Broker } from "./broker/index.js";

export const Screen = (
  { state }: Props
) => {
  switch (state) {
    case "setup":
      return <Setup />;
    case "create":
      return <Create />;
    case "sign-in":
      return <Signin />;
    case "broker-consent":
      return <Broker />;
  }
};
