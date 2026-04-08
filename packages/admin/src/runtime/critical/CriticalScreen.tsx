import type { CriticalProps } from "./Critical.types.js";
import { OfflineView } from "./views/OfflineView.js";
import { ServerDownView } from "./views/ServerDownView.js";
import { CriticalErrorView } from "./views/CriticalErrorView.js";

export const CriticalScreen = ({ state }: CriticalProps) => {
  if (state === "offline") {
    return <OfflineView />;
  }

  if (state === "server-down") {
    return <ServerDownView />;
  }

  return <CriticalErrorView />;
};
