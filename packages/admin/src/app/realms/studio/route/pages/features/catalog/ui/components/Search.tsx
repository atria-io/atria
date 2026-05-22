import * as Icon from "lucide-react";

export function CatalogSearch() {
  return (
    <div className="pages-catalog__search">
      <button
        type="button"
        className="button button--square button--icon pages-catalog__search-action"
        aria-label="Search"
      >
        <div className="button__icon">
          <Icon.Search size={13} />
        </div>
      </button>
      <input
        type="text"
        className="input input--sm input--full input--subtle input--focus-line"
        aria-label="Search pages"
        placeholder="Search pages..."
      />
    </div>
  );
}
