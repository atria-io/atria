import { CatalogHeader } from "./parts/header/CatalogHeader.js";
import { CatalogSearch } from "./parts/search/CatalogSearch.js";
import { CatalogMain } from "./parts/main/CatalogMain.js";

export function CatalogView() {
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
