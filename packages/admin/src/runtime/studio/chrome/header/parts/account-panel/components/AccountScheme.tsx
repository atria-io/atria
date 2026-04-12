import type { AccountSchemeSwitcherProps } from "../AccountPanelTypes.js";

export const AccountScheme = ({
  mode,
  modes,
  onSetMode,
}: AccountSchemeSwitcherProps) => (
  <div className="studio-account__scheme" aria-label="Scheme actions">
    {modes.map((schemeMode) => (
      <button
        key={schemeMode}
        type="button"
        data-active={mode === schemeMode}
        className={"studio-account__scheme-button"}
        onClick={() => onSetMode(schemeMode)}
      >
        {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
      </button>
    ))}
  </div>
);
