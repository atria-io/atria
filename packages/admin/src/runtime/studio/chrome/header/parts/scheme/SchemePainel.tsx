import { useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import { useAccountPanel } from "../account-panel/useAccountPanel.js";

export const SchemePainel = () => {
  const { mode, modes, setMode } = useScheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = useAccountPanel(rootRef);
  const schemeIcons = {
    system: Monitor,
    dark: Moon,
    light: Sun,
  } as const;
  const CurrentSchemeIcon = schemeIcons[mode];
  const PANEL_ID = "studio-scheme-panel-menu";

  return (
    <div className="studio-scheme" data-tooltip="Scheme">
      <div className="studio-scheme__container" ref={rootRef}>
        <button
          type="button"
          className="studio-scheme__trigger"
          aria-label="Scheme actions"
          aria-haspopup="menu"
          aria-controls={PANEL_ID}
          aria-expanded={isOpen}
          onClick={togglePanel}
        >
          <CurrentSchemeIcon size={16} className="studio-scheme__icon" />
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
                      className="button--xs"
                      key={schemeMode}
                      type="button"
                      data-active={mode === schemeMode}
                      onClick={() => setMode(schemeMode)}
                    >
                      <span className="studio-scheme__option">
                        <SchemeIcon size={16} className="studio-scheme__icon" />
                        <span>{schemeMode[0].toUpperCase() + schemeMode.slice(1)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
