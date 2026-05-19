import { useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { SchemeButton } from "./SchemeButton.js";
import { SchemePanel } from "./SchemePanel.js";
import { useScheme } from "@/system/services/scheme/useScheme.js";
import { usePopoverState } from "../account/service/usePopoverState.js";
import type { SchemeButtonProps } from "./SchemeButton.js";
import type { SchemePanelProps } from "./SchemePanel.js";

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

  const buttonProps: SchemeButtonProps = {
    panelId: PANEL_ID,
    isOpen,
    onToggle: togglePanel,
    CurrentSchemeIcon,
  };

  const panelProps: SchemePanelProps = {
    panelId: PANEL_ID,
    isClosing,
    onPanelAnimationEnd,
    modes,
    mode,
    setMode,
    schemeIcons,
  };

  return (
    <div className="studio-scheme" data-tooltip="Scheme" ref={rootRef}>
      <SchemeButton {...buttonProps} />
      {isMounted ? <SchemePanel {...panelProps} /> : null}
    </div>
  );
};
