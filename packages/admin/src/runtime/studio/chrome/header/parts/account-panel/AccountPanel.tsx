import { useRef } from "react";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import type { AccountPanelProps } from "./AccountPanelTypes.js";
import { useAccountPanelActions } from "./AccountPanelActions.js";
import { AccountIdentity } from "./components/AccountIdentity.js";
import { AccountLogout } from "./components/AccountLogout.js";
import { AccountScheme } from "./components/AccountScheme.js";

export const AccountPanel = ({ user, onLogout }: AccountPanelProps) => {
  const { mode, modes, setMode } = useScheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = useAccountPanelActions(rootRef);

  return (
    <div className="studio-account__container" ref={rootRef}>
      <button
        type="button"
        className="studio-account__profile"
        aria-label="User info"
        aria-expanded={isOpen}
        onClick={togglePanel}
        data-tooltip="Painel"
      >
        <AccountIdentity user={user} avatarSize={22} />
      </button>
      {isMounted ? (
        <div
          className={
            !isClosing ?
            "studio-account__panel studio-account__panel--open" :
            "studio-account__panel studio-account__panel--closing"
          }
          onAnimationEnd={onPanelAnimationEnd}
        >
          <div className="studio-account__menu">
            <div className="studio-account__menu--content">
              <AccountIdentity user={user} avatarSize={24} showDetails />
              <AccountScheme mode={mode} modes={modes} onSetMode={setMode} />
              <AccountLogout onLogout={onLogout} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
