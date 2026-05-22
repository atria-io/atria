import * as React from "react";
import * as Icon from "lucide-react";
import { Popover } from "@atria/ui";
import { Button } from "@atria/ui";
import { usePopover } from "@atria/ui";
import { useScheme } from "@/app/system/services/scheme/use.scheme.js";
import type { SchemeMode } from "@/app/system/services/scheme/scheme.types.js";

const PANEL_ID = "studio-scheme-panel-menu";
const schemeIcons: Record<SchemeMode, Icon.LucideIcon> = {
  system: Icon.Monitor,
  dark: Icon.Moon,
  light: Icon.Sun,
};

type SchemeProps = {
  panelId: string;
  isOpen: boolean;
  isClosing: boolean;
  isMounted: boolean;
  onToggle: () => void;
  onPanelAnimationEnd: React.AnimationEventHandler<HTMLDivElement>;
  modes: readonly SchemeMode[];
  mode: SchemeMode;
  setMode: (mode: SchemeMode) => void;
  CurrentSchemeIcon: Icon.LucideIcon;
  schemeIcons: Record<SchemeMode, Icon.LucideIcon>;
};

function SchemeButton({ panelId, isOpen, onToggle, CurrentSchemeIcon }: SchemeProps) {
  return (
    <Button
      type="button"
      variant="overlay"
      square
      icon
      aria-label="Scheme actions"
      aria-haspopup="menu"
      aria-controls={panelId}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <CurrentSchemeIcon size={16} />
    </Button>
  );
}

function SchemeModeButton({ schemeMode, mode, setMode, schemeIcons }: {
  schemeMode: SchemeMode;
  mode: SchemeMode;
  setMode: (mode: SchemeMode) => void;
  schemeIcons: Record<SchemeMode, Icon.LucideIcon>;
}) {
  const SchemeIcon = schemeIcons[schemeMode];

  return (
    <Button
      variant="overlay"
      align="start"
      label={schemeMode[0].toUpperCase() + schemeMode.slice(1)}
      type="button"
      data-active={mode === schemeMode}
      onClick={() => setMode(schemeMode)}
      square
      icon
    >
      <SchemeIcon size={16} />
    </Button>
  );
}

function SchemeContent({ modes, mode, setMode, schemeIcons }: SchemeProps) {
  return (
    <>
      {modes.map((schemeMode) => (
        <SchemeModeButton
          key={schemeMode}
          schemeMode={schemeMode}
          mode={mode}
          setMode={setMode}
          schemeIcons={schemeIcons}
        />
      ))}
    </>
  );
}

function SchemePopover({ panelId, isOpen, isClosing, isMounted, onPanelAnimationEnd, children }: SchemeProps & { children: React.ReactNode }) {
  return (
    <Popover
      id={panelId}
      open={isOpen}
      closing={isClosing}
      mounted={isMounted}
      onAnimationEnd={onPanelAnimationEnd}
    >
      {children}
    </Popover>
  );
}

const Scheme = () => {
  const { mode, modes, setMode } = useScheme();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, toggle, onAnimationEnd } = usePopover(rootRef);
  const CurrentSchemeIcon = schemeIcons[mode];
  const props: SchemeProps = {
    panelId: PANEL_ID,
    isOpen,
    isClosing,
    isMounted,
    onToggle: toggle,
    onPanelAnimationEnd: onAnimationEnd,
    modes,
    mode,
    setMode,
    CurrentSchemeIcon,
    schemeIcons,
  };

  return (
    <div
      className="studio-scheme"
      data-tooltip={isMounted ? undefined : "Scheme"}
      data-tooltip-disabled={isMounted ? "true" : undefined}
      ref={rootRef}
    >
      <SchemeButton {...props} />
      <SchemePopover {...props}>
        <SchemeContent {...props} />
      </SchemePopover>
    </div>
  );
};

export { Scheme };
