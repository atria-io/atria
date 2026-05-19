import type { LucideIcon } from "lucide-react";

export interface SchemeButtonProps {
  panelId: string;
  isOpen: boolean;
  onToggle: () => void;
  CurrentSchemeIcon: LucideIcon;
}

export function SchemeButton({
  panelId,
  isOpen,
  onToggle,
  CurrentSchemeIcon
}: SchemeButtonProps) {
  return (
    <button
      type="button"
      className="button button--square button--overlay button--has-icon"
      aria-label="Scheme actions"
      aria-haspopup="menu"
      aria-controls={panelId}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <div className="button__icon">
        <CurrentSchemeIcon size={16} className="studio-scheme__icon" />
      </div>
    </button>
  );
}
