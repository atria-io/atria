import * as Icon from "lucide-react";
import { Button } from "@atria/ui";

export function CloseEditor() {
  const onClose = (): void => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="pages-editor__header-close" aria-label="Close Page">
      <Button
        type="button"
        square
        icon
        variant="overlay"
        aria-label="Close"
        data-tooltip="Close"
        onClick={onClose}
      >
        <Icon.X size={16} />
      </Button>
    </div>
  );
}
