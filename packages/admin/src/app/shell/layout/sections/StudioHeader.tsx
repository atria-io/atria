import { useEffect, useState } from "react";
import type { BootstrapUserSummary } from "../../../bootstrap/getBootstrapState.js";

type SchemeMode = "system" | "light" | "dark";
type ResolvedScheme = "light" | "dark";

interface RuntimeScheme {
  mode: SchemeMode;
  resolved: ResolvedScheme;
  setMode: (mode: SchemeMode) => void;
}

interface RuntimeAtria {
  scheme?: RuntimeScheme;
}

declare global {
  interface Window {
    __atria__?: RuntimeAtria;
  }
}

export interface StudioHeaderProps {
  user: BootstrapUserSummary;
  onLogout: () => void;
}

const readRuntimeScheme = (): { mode: SchemeMode; resolved: ResolvedScheme } => {
  const runtimeScheme = window.__atria__?.scheme;
  if (!runtimeScheme) {
    return { mode: "system", resolved: "light" };
  }

  return {
    mode: runtimeScheme.mode,
    resolved: runtimeScheme.resolved,
  };
};

export const StudioHeader = ({ user, onLogout }: StudioHeaderProps) => {
  const [scheme, setScheme] = useState<{ mode: SchemeMode; resolved: ResolvedScheme }>({
    mode: "system",
    resolved: "light",
  });

  useEffect(() => {
    const syncScheme = (): void => {
      setScheme(readRuntimeScheme());
    };

    syncScheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (): void => {
      if (window.__atria__?.scheme?.mode === "system") {
        syncScheme();
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  const setMode = (mode: SchemeMode): void => {
    window.__atria__?.scheme?.setMode(mode);
    setScheme(readRuntimeScheme());
  };

  return (
    <header className="admin-shell__header">
      <div>Studio</div>
      <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
        <button type="button" onClick={() => setMode("system")}>
          System
        </button>
        <button type="button" onClick={() => setMode("light")}>
          Light
        </button>
        <button type="button" onClick={() => setMode("dark")}>
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
          <span style={{ opacity: 0.7 }}>{scheme.mode}/{scheme.resolved}</span>
        </div>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};
