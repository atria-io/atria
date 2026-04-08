import { useEffect, useState } from "react";
import type { AppUser } from "../../StudioTypes.js";
import { useRuntimeScheme } from "../../../../system/runtimeScheme.js";

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
  user: AppUser;
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
    <div className="studio-account studio-account--layout" aria-label="Account panel">
      <section className="studio-account__user studio-account__group" aria-label="User info">
        {user.avatarUrl ? (
          <img className="studio-account__avatar-image" src={user.avatarUrl} alt={user.name} width={24} height={24} />
        ) : (
          <span className="studio-account__avatar" aria-label="Avatar" />
        )}
        <span className="studio-account__name">{user.name}</span>
      </section>

      <section className="studio-account__scheme studio-account__group" aria-label="Scheme actions">
        {schemeModes.map((schemeMode) => (
          <button
            key={schemeMode}
            type="button"
            data-active={mode === schemeMode}
            className={
              mode === schemeMode
                ? "studio-account__scheme-button studio-account__scheme-button--active"
                : "studio-account__scheme-button"
            }
            onClick={() => handleSetMode(schemeMode)}
          >
            {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
          </button>
        ))}
        <span className="studio-account__scheme-label">
          {mode}/{resolved}
        </span>
      </section>

      <section className="studio-account__logout" aria-label="Logout action">
        <button className="studio-account__logout-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </section>
    </div>
  );
};
