import { CatalogHeader } from "./parts/header/CatalogHeader.js";
import { CatalogSearch } from "./parts/search/CatalogSearch.js";
import { CatalogMain } from "./parts/main/CatalogMain.js";
import { useCatalogReset } from "./services/useCatalogReset.js";

export function CatalogView() {
  const { onCatalogClick } = useCatalogReset();

  return (
    <div className="card-column__item" data-type="catalog">
      <div className="card-screen" onClick={onCatalogClick}>
        <div className="pages-catalog">
          <CatalogHeader />
          <CatalogSearch />
          <CatalogMain />
        </div>
      </div>
    </div>
  );
}
