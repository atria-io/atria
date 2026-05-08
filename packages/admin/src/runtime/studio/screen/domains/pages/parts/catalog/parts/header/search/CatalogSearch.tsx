import { Search } from "lucide-react";

export function CatalogSearch() {
  return (
    <div className="catalog-search">
      <button
        type="button"
        className="button button--square button--overlay button--has-icon catalog-search__action"
        aria-label="Search"
      >
        <div className="button__icon">
          <Search size={16} />
        </div>
      </button>
      <div>Search list</div>
    </div>
  );
}
