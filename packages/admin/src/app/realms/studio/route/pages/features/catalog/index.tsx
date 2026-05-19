import { CatalogHeader } from "./ui/CatalogHeader.js";
import { CatalogSearch } from "./ui/CatalogSearch.js";
import { CatalogMain } from "./ui/CatalogMain.js";

export function Catalog() {
  return (
    <div className="card-column__item" data-type="catalog">
      <div className="card-screen">
        <div className="pages-catalog">
          <CatalogHeader />
          <CatalogSearch />
          <CatalogMain />
        </div>
      </div>
    </div>
  );
}
