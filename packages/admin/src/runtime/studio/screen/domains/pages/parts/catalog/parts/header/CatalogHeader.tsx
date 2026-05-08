import { CatalogCreate } from "./CatalogCreate.js";
import { CatalogSearch } from "./CatalogSearch.js";

export function CatalogHeaderView() {
  return (
    <div className="card-screen">
      <CatalogCreate />
      <CatalogSearch />
    </div>
  );
}
