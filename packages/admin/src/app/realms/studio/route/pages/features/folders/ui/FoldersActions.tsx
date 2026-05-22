import * as Icon from "lucide-react";
import { Button } from "@atria/ui";

export function FoldersActions() {
  return (
    <>
      <div>Folders</div>
      <div className="pages-folders__header-action">
        <Button
          type="button"
          variant="overlay"
          square
          icon
          className="pages-catalog__action--create"
          aria-label="Add Folder"
          data-tooltip="Add Folder"
        >
          <Icon.Plus size={16} />
        </Button>
      </div>
    </>
  );
}
