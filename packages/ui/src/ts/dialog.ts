import * as React from "react";

function useDialog({
  value,
  disabled = false,
  onClose,
}: {
  value: unknown;
  disabled?: boolean;
  onClose: () => void;
}) {
  const mounted = Boolean(value);
  const open = mounted;

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape" || disabled) {
        return;
      }
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, disabled, onClose]);

  const onBackdropClick = React.useCallback((): void => {
    if (!disabled) {
      onClose();
    }
  }, [disabled, onClose]);

  return { open, mounted, onBackdropClick };
}

export { useDialog };
