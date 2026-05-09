import { Archive, ListFilter, Plus } from "lucide-react";
import { resolveCreatePath } from "../../../../services/state/pagesState.js";
import { startEditorCreateMode } from "../../../editor/services/editorState.js";
import { CatalogActionButton } from "./shared/CatalogActionButton.js";

export function CatalogActions() {
  const onCreatePage = (): void => {
    startEditorCreateMode();
    const nextPath = resolveCreatePath(window.location.pathname);
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <>
      <div>Catalog</div>
      <div className="pages-catalog__header-action">
        <CatalogActionButton
          actionClassName="pages-catalog__action--filter"
          ariaLabel="Filter"
          tooltip="Filter"
          Icon={ListFilter}
          iconSize={13}
        />
        <CatalogActionButton
          actionClassName="pages-catalog__action--archived"
          ariaLabel="Archived"
          tooltip="Archived"
          Icon={Archive}
          iconSize={13}
        />
        <CatalogActionButton
          actionClassName="pages-catalog__action--create"
          ariaLabel="Add Page"
          tooltip="Add Page"
          Icon={Plus}
          iconSize={16}
          onClick={onCreatePage}
        />
      </div>
    </>
  );
}
