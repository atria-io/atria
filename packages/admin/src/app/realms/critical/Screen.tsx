import type { Props } from "./types.js";
import { OfflineView } from "./screen/offline/OfflineView.js";
import { ServerDownView } from "./screen/server/ServerView.js";
import { CriticalErrorView } from "./screen/fatal/FatalView.js";

export const Screen = (
  { state }: Props
) => {
  if (state === "offline") {
    return <OfflineView />;
  }

  if (state === "server-down") {
    return <ServerDownView />;
  }

  return <CriticalErrorView />;
};
