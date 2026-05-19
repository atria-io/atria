import { Plus } from "lucide-react";
import { CatalogActionButton } from "../../../catalog/parts/header/shared/CatalogActionButton.js";

export function FoldersActions() {
  return (
    <>
      <div>Folders</div>
      <div className="pages-folders__header-action">
        <CatalogActionButton
          actionClassName="pages-catalog__action--create"
          ariaLabel="Add Folder"
          tooltip="Add Folder"
          Icon={Plus}
          iconSize={16}
        />
      </div>
    </>
  );
}
