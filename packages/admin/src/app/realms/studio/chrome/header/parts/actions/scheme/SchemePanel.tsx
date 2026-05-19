import type { AnimationEventHandler } from "react";
import type { LucideIcon } from "lucide-react";
import type { SchemeMode } from "@/system/services/scheme/schemeTypes.js";

export interface SchemePanelProps {
  panelId: string;
  isClosing: boolean;
  onPanelAnimationEnd: AnimationEventHandler<HTMLDivElement>;
  modes: readonly SchemeMode[];
  mode: SchemeMode;
  setMode: (mode: SchemeMode) => void;
  schemeIcons: Record<SchemeMode, LucideIcon>;
}

export function SchemePanel({
  panelId,
  isClosing,
  onPanelAnimationEnd,
  modes,
  mode,
  setMode,
  schemeIcons,
}: SchemePanelProps) {
  return (
    <div
      id={panelId}
      className={
        !isClosing
          ? "studio-scheme__panel studio-scheme__panel--open"
          : "studio-scheme__panel studio-scheme__panel--closing"
      }
      onAnimationEnd={onPanelAnimationEnd}
    >
      <div className="studio-scheme__menu">
        <div className="studio-scheme__menu-content" aria-label="Scheme modes">
          {modes.map((schemeMode) => {
            const SchemeIcon = schemeIcons[schemeMode];

            return (
              <button
                className="button button--square button--overlay button--has-icon button--start"
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
  );
}
