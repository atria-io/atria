import { useBrokerConsent } from "./model/broker.state.js";
import { BrokerUI } from "./ui/Broker.js";

function Broker() {
  const model = useBrokerConsent();
  return <BrokerUI {...model} />;
}

export { Broker };
