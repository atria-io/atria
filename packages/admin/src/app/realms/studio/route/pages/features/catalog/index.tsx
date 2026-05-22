import { CatalogHeader } from "./ui/components/Header.js";
import { CatalogSearch } from "./ui/components/Search.js";
import { CatalogMain } from "./ui/components/Main.js";

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
