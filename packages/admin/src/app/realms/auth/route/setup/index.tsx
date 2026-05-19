import { useSetupState } from "./model/setup.state.js";
import { SetupUI } from "./ui/Setup.js";

function Setup() {
  const model = useSetupState();
  return <SetupUI {...model} />;
}

export { Setup };
