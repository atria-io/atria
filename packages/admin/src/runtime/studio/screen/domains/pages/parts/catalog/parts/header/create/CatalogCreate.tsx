import { Plus } from "lucide-react";
import { resolveCreatePath } from "../../../../../services/resolveCreate.js";

export function CatalogCreate() {
  const onCreatePage = (): void => {
    const nextPath = resolveCreatePath(window.location.pathname);
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="catalog-header">
      <div>Catalog</div>
      <button
        type="button"
        className="button button--square button--overlay button--has-icon catalog-header__action"
        aria-label="New Page"
        data-tooltip="New Page"
        onClick={onCreatePage}
      >
        <div className="button__icon">
          <Plus size={16} />
        </div>
      </button>
    </div>
  );
}
