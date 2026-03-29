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

const readRuntimeMode = (): SchemeMode => getRuntimeScheme()?.mode ?? "system";

export interface StudioAccountPanelProps {
  user: BootstrapUserSummary;
  onLogout: () => void;
}

const schemeModes: SchemeMode[] = ["system", "light", "dark"];

export const StudioAccountPanel = ({ user, onLogout }: StudioAccountPanelProps) => {
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
    <div
      style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}
      aria-label="Account panel"
    >
      <section style={{ display: "flex", alignItems: "center", gap: "8px" }} aria-label="User info">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} width={24} height={24} />
        ) : (
          <span
            aria-label="Avatar"
            style={{ width: "24px", height: "24px", borderRadius: "50%", background: "currentColor", opacity: 0.3 }}
          />
        )}
        <span>{user.name}</span>
      </section>

      <section style={{ display: "flex", alignItems: "center", gap: "8px" }} aria-label="Scheme actions">
        {schemeModes.map((schemeMode) => (
          <button
            key={schemeMode}
            type="button"
            data-active={mode === schemeMode}
            onClick={() => handleSetMode(schemeMode)}
          >
            {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
          </button>
        ))}
        <span style={{ opacity: 0.7 }}>{mode}/{resolved}</span>
      </section>

      <section aria-label="Logout action">
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </section>
    </div>
  );
};
