import React, { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../../../../../types/auth.js";
import type { ColorSchemePreference } from "../../model/useColorScheme.js";

interface StudioHeaderMenuProps {
  colorSchemePreference: ColorSchemePreference;
  onColorSchemeChange: (scheme: ColorSchemePreference) => void;
  locale: (key: string) => string;
  user: AuthUser | null;
  onLogout: () => void;
}

const SCHEME_OPTIONS: ColorSchemePreference[] = ["system", "dark", "light"];

const resolveUserName = (user: AuthUser | null, fallbackName: string): string => {
  if (user?.name && user.name.trim().length > 0) {
    return user.name.trim();
  }

  if (user?.email && user.email.trim().length > 0) {
    const localPart = user.email.trim().split("@")[0];
    if (localPart.length > 0) {
      return localPart;
    }
  }

  return fallbackName;
};

const resolveUserEmail = (user: AuthUser | null, fallbackEmail: string): string => {
  if (user?.email && user.email.trim().length > 0) {
    return user.email.trim();
  }

  return fallbackEmail;
};

const resolveAvatarInitials = (displayName: string, displayEmail: string): string => {
  const candidate = displayName.trim().length > 0 ? displayName : displayEmail;
  const words = candidate
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter((part) => part.length > 0);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export function StudioHeaderMenu(props: StudioHeaderMenuProps): React.JSX.Element {
  const { colorSchemePreference, onColorSchemeChange, locale, user, onLogout } = props;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayName = resolveUserName(user, locale("shell.user.defaultName"));
  const displayEmail = resolveUserEmail(user, locale("shell.user.defaultEmail"));
  const avatarInitials = resolveAvatarInitials(displayName, displayEmail);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }

      setIsMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  const renderAvatar = (className: string): React.JSX.Element => (
    <span className={className}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={displayName} className="admin-shell__avatar-image" />
      ) : (
        <span className="admin-shell__avatar-initials">{avatarInitials}</span>
      )}
    </span>
  );

  return (
    <div className="admin-shell__user-menu" ref={menuRef}>
      <button
        type="button"
        className="admin-shell__avatar-button"
        onClick={() => setIsMenuOpen((current) => !current)}
        aria-expanded={isMenuOpen}
        aria-label={displayName}
      >
        {renderAvatar("admin-shell__avatar")}
      </button>

      {isMenuOpen ? (
        <section className="admin-shell__menu" aria-label={displayName}>
          <div className="admin-shell__menu-user">
            {renderAvatar("admin-shell__avatar admin-shell__avatar--large")}
            <div className="admin-shell__menu-user-text">
              <p className="admin-shell__menu-name">{displayName}</p>
              <p className="admin-shell__menu-email">{displayEmail}</p>
            </div>
          </div>

          <div className="admin-shell__menu-separator" />

          {SCHEME_OPTIONS.map((scheme) => {
            const labelKey = `shell.scheme.${scheme}`;

            return (
              <button
                key={scheme}
                type="button"
                className="admin-shell__menu-item"
                onClick={() => onColorSchemeChange(scheme)}
              >
                <span>{locale(labelKey)}</span>
                {colorSchemePreference === scheme ? (
                  <span className="admin-shell__menu-check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="admin-shell__menu-separator" />

          <button
            type="button"
            className="admin-shell__menu-item admin-shell__menu-item--danger"
            onClick={() => {
              setIsMenuOpen(false);
              onLogout();
            }}
          >
            {locale("shell.logout")}
          </button>
        </section>
      ) : null}
    </div>
  );
}
