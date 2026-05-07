import { useRef } from "react";
import { useAccountPanel } from "../useAccountPanel.js";
import { AccountLogout } from "./AccountLogout.js";
import type { AccountPanelProps } from "../accountPanelTypes.js";

export const AccountPanelProvider = ({ user, onLogout }: AccountPanelProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = useAccountPanel(rootRef);
  const panelId = "studio-account-panel-menu";
  const panelClassName = isClosing
    ? "studio-account__panel studio-account__panel--closing"
    : "studio-account__panel studio-account__panel--open";

  return (
    <div className="studio-account" data-tooltip={user.name} ref={rootRef}>
      <button
        type="button"
        className="button button--has-icon admin-header__action-button"
        aria-label="User info"
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={togglePanel}
      >
        <div className="studio-account__profile-user" aria-label="User info">
          <img
            className="studio-account__avatar"
            src={user.avatarUrl}
            alt={user.name}
            width={22}
            height={22}
          />
        </div>
      </button>
      {isMounted ? (
        <div id={panelId} className={panelClassName} onAnimationEnd={onPanelAnimationEnd}>
          <div className="studio-account__menu">
            <div className="studio-account__menu-content">
              <div className="studio-account__user" aria-label="User info">
                <img
                  className="studio-account__avatar"
                  src={user.avatarUrl}
                  alt={user.name}
                  width={24}
                  height={24}
                />
                <div className="studio-account__info">
                  <span className="studio-account__name">{user.name}</span>
                  <span className="studio-account__email">{user.email}</span>
                </div>
              </div>
              <AccountLogout onLogout={onLogout} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
