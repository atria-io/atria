import { useEffect, useState } from "react";
import type { BootstrapUserSummary } from "../../../bootstrap/getBootstrapState.js";
import { useRuntimeScheme } from "../../../runtime/useRuntimeScheme.js";

type SchemeMode = "system" | "light" | "dark";

interface RuntimeScheme {
  mode: SchemeMode;
  setMode: (mode: SchemeMode) => void;
}

const getRuntimeScheme = (): RuntimeScheme | null => {
  const runtimeScheme = (window as { __atria__?: { scheme?: Partial<RuntimeScheme> } }).__atria__?.scheme;
  if (!runtimeScheme) {
    return null;
  }

  if (
    (runtimeScheme.mode !== "system" && runtimeScheme.mode !== "light" && runtimeScheme.mode !== "dark") ||
    typeof runtimeScheme.setMode !== "function"
  ) {
    return null;
  }

  return runtimeScheme as RuntimeScheme;
};

export interface StudioHeaderProps {
  user: BootstrapUserSummary;
  onLogout: () => void;
}

const readRuntimeMode = (): SchemeMode => getRuntimeScheme()?.mode ?? "system";

export const StudioHeader = ({ user, onLogout }: StudioHeaderProps) => {
  const resolved = useRuntimeScheme();
  const [mode, setMode] = useState<SchemeMode>(() => readRuntimeMode());

  useEffect(() => {
    setMode(readRuntimeMode());
  }, [resolved]);

  const handleSetMode = (nextMode: SchemeMode): void => {
    getRuntimeScheme()?.setMode(nextMode);
    setMode(readRuntimeMode());
  };

  return (
    <header className="admin-shell__header">
      <div>Studio</div>
      <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
        <button type="button" data-active={mode === "system"} onClick={() => handleSetMode("system")}>
          System
        </button>
        <button type="button" data-active={mode === "light"} onClick={() => handleSetMode("light")}>
          Light
        </button>
        <button type="button" data-active={mode === "dark"} onClick={() => handleSetMode("dark")}>
          Dark
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} width={24} height={24} />
          ) : (
            <span
              aria-label="Avatar"
              style={{ width: "24px", height: "24px", borderRadius: "50%", background: "currentColor", opacity: 0.3 }}
            />
          )}
          <span>{user.name}</span>
          <span style={{ opacity: 0.7 }}>{mode}/{resolved}</span>
        </div>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};
