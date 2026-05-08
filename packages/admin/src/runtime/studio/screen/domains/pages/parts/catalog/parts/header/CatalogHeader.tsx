import { CatalogCreate } from "./create/CatalogCreate.js";
import { CatalogSearch } from "./search/CatalogSearch.js";

export function CatalogHeader() {
  return (
    <div className="card-screen">
      <CatalogCreate />
      <CatalogSearch />
    </div>
  );
}
