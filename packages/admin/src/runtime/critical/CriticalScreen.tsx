import type { CriticalScreen as CriticalState } from "../../system/runtimeTypes.js";
import { OfflineView } from "./views/OfflineView.js";
import { ServerDownView } from "./views/ServerDownView.js";
import { CriticalErrorView } from "./views/CriticalErrorView.js";

export interface CriticalScreenProps {
  screen: CriticalState;
}

export const CriticalScreen = ({ screen }: CriticalScreenProps) => {
  if (screen === "offline") {
    return <OfflineView />;
  }

  if (screen === "server-down") {
    return <ServerDownView />;
  }

  return <CriticalErrorView />;
};
