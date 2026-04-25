import { useRef } from "react";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import { useAccountPanelActions } from "../account-panel/AccountPanelActions.js";

export const SchemePainel = () => {
  const { mode, modes, setMode } = useScheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = useAccountPanelActions(rootRef);
  const PANEL_ID = "studio-scheme-panel-menu";

  return (
    <div className="studio-scheme">
      <div className="studio-scheme__container" ref={rootRef}>
        <button
          type="button"
          className="studio-scheme__trigger"
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
            className={
              !isClosing ?
              "studio-scheme__panel studio-scheme__panel--open" :
              "studio-scheme__panel studio-scheme__panel--closing"
            }
            onAnimationEnd={onPanelAnimationEnd}
          >
            <div className="studio-scheme__menu">
              <div className="studio-scheme__menu-content" aria-label="Scheme modes">
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
    </div>
  );
};
