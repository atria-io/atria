import type { AccountSchemeProps } from "../AccountPanelTypes.js";

export const AccountScheme = ({
  mode,
  modes,
  onSetMode,
}: AccountSchemeProps) => (
  <div className="studio-account__scheme" aria-label="Scheme actions">
    {modes.map((schemeMode) => (
      <button
        key={schemeMode}
        type="button"
        data-active={mode === schemeMode}
        className=""
        onClick={() => onSetMode(schemeMode)}
      >
        {schemeMode[0].toUpperCase() + schemeMode.slice(1)}
      </button>
    ))}
  </div>
);
