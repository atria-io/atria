import React from "react";
import type { AuthUser } from "../../../../types/auth.js";
import type { ColorScheme, ColorSchemePreference } from "../model/useColorScheme.js";
import { StudioHeader } from "./sections/StudioHeader.js";

interface StudioShellProps {
  routeId: string;
  colorScheme: ColorScheme;
  colorSchemePreference: ColorSchemePreference;
  onColorSchemeChange: (scheme: ColorSchemePreference) => void;
  locale: (key: string) => string;
  user: AuthUser | null;
  showHeader?: boolean;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function StudioShell(props: StudioShellProps): React.JSX.Element {
  const {
    routeId,
    colorScheme,
    colorSchemePreference,
    onColorSchemeChange,
    locale,
    user,
    showHeader = true,
    onLogout,
    children
  } = props;

  return (
    <div className="admin-shell" data-route={routeId} data-scheme={colorScheme}>
      {showHeader ? (
        <StudioHeader
          colorSchemePreference={colorSchemePreference}
          onColorSchemeChange={onColorSchemeChange}
          locale={locale}
          user={user}
          onLogout={onLogout}
        />
      ) : null}

      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
