import React from "react";
import type { AuthUser } from "../../../types/auth.js";
import type { ColorSchemePreference } from "./hooks/useColorScheme.js";
import { StudioHeaderMenu } from "./StudioHeaderMenu.js";

interface StudioHeaderProps {
  colorSchemePreference: ColorSchemePreference;
  onColorSchemeChange: (scheme: ColorSchemePreference) => void;
  locale: (key: string) => string;
  user: AuthUser | null;
  onLogout?: () => void;
}

export function StudioHeader(props: StudioHeaderProps): React.JSX.Element {
  const { colorSchemePreference, onColorSchemeChange, locale, user, onLogout } = props;

  return (
    <header className="admin-shell__header">
      {onLogout ? (
        <StudioHeaderMenu
          colorSchemePreference={colorSchemePreference}
          onColorSchemeChange={onColorSchemeChange}
          locale={locale}
          user={user}
          onLogout={onLogout}
        />
      ) : null}
    </header>
  );
}
