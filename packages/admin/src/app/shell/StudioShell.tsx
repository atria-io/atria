import React from "react";
import type { TranslateFn } from "../../i18n/client.js";

interface StudioShellProps {
  title: string;
  subtitle: string;
  locale: string;
  locales: string[];
  showHeader?: boolean;
  onLocaleChange: (locale: string) => void;
  t: TranslateFn;
  children: React.ReactNode;
}

export function StudioShell(props: StudioShellProps): React.JSX.Element {
  const {
    title,
    subtitle,
    locale,
    locales,
    showHeader = true,
    onLocaleChange,
    t,
    children
  } = props;

  return (
    <div className={showHeader ? "admin-shell" : "admin-shell admin-shell--headerless"}>
      {showHeader ? (
        <header className="admin-shell__header">
          <div className="admin-shell__branding">
            <p className="admin-shell__brand">{t("common.brand")}</p>
            <h1 className="admin-shell__title">{title}</h1>
            <p className="admin-shell__subtitle">{subtitle}</p>
          </div>

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
        </header>
      ) : null}

      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
