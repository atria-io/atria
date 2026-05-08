import { useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import { usePopoverState } from "../account/service/usePopoverState.js";

export const Scheme = () => {
  const { mode, modes, setMode } = useScheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = usePopoverState(rootRef);
  const schemeIcons = {
    system: Monitor,
    dark: Moon,
    light: Sun,
  } as const;
  const CurrentSchemeIcon = schemeIcons[mode];
  const PANEL_ID = "studio-scheme-panel-menu";

  return (
    <div className="studio-scheme" data-tooltip="Scheme" ref={rootRef}>
      <button
        type="button"
        className="button button--overlay button--has-icon admin-header__action-button"
        aria-label="Scheme actions"
        aria-haspopup="menu"
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        onClick={togglePanel}
      >
        <div className="button__icon">
          <CurrentSchemeIcon size={16} className="studio-scheme__icon" />
        </div>
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
              {modes.map((schemeMode) => {
                const SchemeIcon = schemeIcons[schemeMode];

                return (
                  <button
                    className="button button--xs button--overlay button--has-icon button--start"
                    key={schemeMode}
                    type="button"
                    data-active={mode === schemeMode}
                    onClick={() => setMode(schemeMode)}
                  >
                    <span className="button__icon" aria-hidden="true">
                      <SchemeIcon size={16} className="studio-scheme__icon" />
                    </span>
                    <span className="button__label">
                      {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
