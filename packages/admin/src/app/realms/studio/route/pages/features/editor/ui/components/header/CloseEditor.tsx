import * as Icon from "lucide-react";
import { Button } from "@atria/ui";
import { keydown } from "@/app/system/hooks/keydown.js";

function CloseEditor() {
  const onClose = () => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  keydown(
    {
      key: "escape",
      preventDefault: true,
    },
    onClose,
  );

  return (
    <div className="pages-editor__close" aria-label="Close Page">
      <Button
        type="button"
        square
        icon
        variant="overlay"
        aria-label="Close"
        data-tooltip="Close"
        data-keydown="Esc"
        onClick={onClose}
      >
        <Icon.X size={16} />
      </Button>
    </div>
  );
}

export { CloseEditor };
