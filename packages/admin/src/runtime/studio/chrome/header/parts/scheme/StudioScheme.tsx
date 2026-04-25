import { useRef } from "react";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import { useAccountPanelActions } from "../account-panel/AccountPanelActions.js";

export const StudioScheme = () => {
  const { mode, modes, setMode } = useScheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = useAccountPanelActions(rootRef);
  const PANEL_ID = "studio-scheme-panel-menu";

  return (
    <div className="admin-header__scheme-container" ref={rootRef}>
      <button
        type="button"
        className="admin-header__scheme-trigger"
        aria-label="Scheme actions"
        aria-haspopup="menu"
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        onClick={togglePanel}
        data-tooltip="Scheme"
      >
        Scheme
      </button>
      {isMounted ? (
        <div
          id={PANEL_ID}
          className={!isClosing ? "admin-header__scheme-panel admin-header__scheme-panel--open" : "admin-header__scheme-panel admin-header__scheme-panel--closing"}
          onAnimationEnd={onPanelAnimationEnd}
        >
          <div className="admin-header__scheme-menu">
            <div className="admin-header__scheme-switch" aria-label="Scheme modes">
              {modes.map((schemeMode) => (
                <button
                  key={schemeMode}
                  type="button"
                  data-active={mode === schemeMode}
                  onClick={() => setMode(schemeMode)}
                >
                  {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
