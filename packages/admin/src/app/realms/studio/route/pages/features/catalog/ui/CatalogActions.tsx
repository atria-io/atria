import * as Icon from "lucide-react";
import { resolveCreatePath } from "../../../routes/pages.routes.js";
import { startEditorCreateMode } from "../../editor/model/editor.state.js";
import { closeArchivedOnly, toggleArchivedOnly, useCatalogFilterState } from "../model/catalog.state.js";
import { CatalogActionButton } from "./CatalogActionButton.js";

export function CatalogActions() {
  const { archivedOnly } = useCatalogFilterState();

  const onCreatePage = (): void => {
    closeArchivedOnly();
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
          Icon={Icon.ListFilter}
          iconSize={13}
        />
        <CatalogActionButton
          actionClassName="pages-catalog__action--archived"
          ariaLabel={archivedOnly ? "Close" : "Archived"}
          tooltip={archivedOnly ? "Close" : "Archived"}
          Icon={archivedOnly ? Icon.X : Icon.Archive}
          iconSize={archivedOnly ? 15 : 13}
          active={archivedOnly}
          onClick={toggleArchivedOnly}
        />
        <CatalogActionButton
          actionClassName="pages-catalog__action--create"
          ariaLabel="Add Page"
          tooltip="Add Page"
          Icon={Icon.Plus}
          iconSize={16}
          onClick={onCreatePage}
        />
      </div>
    </>
  );
}
