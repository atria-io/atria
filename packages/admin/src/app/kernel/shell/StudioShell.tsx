import React from "react";
import type { TranslateFn } from "../../../i18n/client.js";

type ColorScheme = "light" | "dark";

interface StudioShellProps {
  title: string;
  subtitle: string;
  routeId: string;
  colorScheme: ColorScheme;
  locale: string;
  locales: string[];
  showHeader?: boolean;
  onLocaleChange: (locale: string) => void;
  onLogout?: () => void;
  t: TranslateFn;
  children: React.ReactNode;
}

export function StudioShell(props: StudioShellProps): React.JSX.Element {
  const {
    title,
    subtitle,
    routeId,
    colorScheme,
    locale,
    locales,
    showHeader = true,
    onLocaleChange,
    onLogout,
    t,
    children
  } = props;

  return (
    <div className="admin-shell" data-route={routeId} data-scheme={colorScheme}>
      {showHeader ? (
        <header className="admin-shell__header">
          <div className="admin-shell__branding">
            <p className="admin-shell__brand">{t("common.brand")}</p>
            <h1 className="admin-shell__title">{title}</h1>
            <p className="admin-shell__subtitle">{subtitle}</p>
          </div>

          <div className="admin-shell__header-actions">
            <label className="admin-shell__locale">
              <span>{t("shell.language")}</span>
              <select value={locale} onChange={(event) => onLocaleChange(event.target.value)}>
                {locales.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            {onLogout ? (
              <button type="button" className="admin-shell__logout" onClick={onLogout}>
                {t("shell.logout")}
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
