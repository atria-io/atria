import type { AppState } from "./system/runtime/runtimeTypes.js";
import { useAppState } from "./system/state/useAppState.js";
import { useRuntimeScheme } from "./system/runtime/runtimeScheme.js";
import { AdminRouter } from "./app/AdminRouter.js";

export interface AdminAppProps {
  basePath: string;
  initialAppState?: AppState;
}

export const AdminApp = ({ basePath, initialAppState }: AdminAppProps) => {
  const appState = useAppState(basePath, initialAppState);
  const resolved = useRuntimeScheme();
  if (!appState) {
    return null;
  }

  return (
    <div className="admin-shell" data-scheme={resolved}>
      <AdminRouter appState={appState} />
    </div>
  );
};
