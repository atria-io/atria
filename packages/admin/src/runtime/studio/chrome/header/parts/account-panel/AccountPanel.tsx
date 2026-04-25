import { useRef } from "react";
import type { AccountPanelProps } from "./AccountPanelTypes.js";
import { useAccountPanelActions } from "./AccountPanelActions.js";
import { AccountIdentity } from "./components/AccountIdentity.js";
import { AccountLogout } from "./components/AccountLogout.js";

export const AccountPanel = ({ user, onLogout }: AccountPanelProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = useAccountPanelActions(rootRef);

  const PANEL_ID = "studio-account-panel-menu";

  return (
    <div className="studio-account__container" ref={rootRef}>
      <button
        type="button"
        className="studio-account__profile"
        aria-label="User info"
        aria-haspopup="menu"
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        onClick={togglePanel}
        data-tooltip="Painel"
      >
        <AccountIdentity user={user} avatarSize={22} />
      </button>
      {isMounted ? (
        <div
          id={PANEL_ID}
          className={
            !isClosing ?
            "studio-account__panel studio-account__panel--open" :
            "studio-account__panel studio-account__panel--closing"
          }
          onAnimationEnd={onPanelAnimationEnd}
        >
          <div className="studio-account__menu">
            <div className="studio-account__menu-content">
              <AccountIdentity user={user} avatarSize={24} showDetails />
              <AccountLogout onLogout={onLogout} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
