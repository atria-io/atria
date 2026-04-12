import type { AccountSchemeSwitcherProps } from "../AccountPanelTypes.js";

export const AccountSchemeSwitcher = ({
  mode,
  resolved,
  modes,
  onSetMode,
}: AccountSchemeSwitcherProps) => (
  <div className="studio-account__scheme" aria-label="Scheme actions">
    {modes.map((schemeMode) => (
      <button
        key={schemeMode}
        type="button"
        data-active={mode === schemeMode}
        className={
          mode === schemeMode
            ? "studio-account__scheme-button studio-account__scheme-button--active"
            : "studio-account__scheme-button"
        }
        onClick={() => onSetMode(schemeMode)}
      >
        {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
      </button>
    ))}
    <span className="studio-account__scheme-label">
      {mode}/{resolved}
    </span>
  </div>
);
