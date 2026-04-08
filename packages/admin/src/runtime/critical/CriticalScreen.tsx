import type { CriticalScreen as CriticalScreenState } from "./Critical.types.js";
import { OfflineView } from "./views/OfflineView.js";
import { ServerDownView } from "./views/ServerDownView.js";
import { CriticalErrorView } from "./views/CriticalErrorView.js";

export interface CriticalScreenProps {
  screen: CriticalScreenState;
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
