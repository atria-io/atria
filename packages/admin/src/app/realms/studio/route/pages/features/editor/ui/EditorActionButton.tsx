import { Button } from "@atria/ui";

interface EditorActionButtonProps {
  ariaLabel: string;
  label: string;
  tooltip?: string;
  accent?: boolean;
  disabledPointer?: boolean;
  onClick?: () => void;
}

export function EditorActionButton(props: EditorActionButtonProps) {
  const { ariaLabel, tooltip, onClick, label, accent = false, disabledPointer = false } = props;

  return (
    <Button
      type="button"
      size="sm"
      align="center"
      variant={["fill", "overlay"]}
      className={accent ? "button--accent" : ""}
      style={disabledPointer ? { pointerEvents: "none" } : undefined}
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      onClick={onClick}
      label={label}
    />
  );
}
