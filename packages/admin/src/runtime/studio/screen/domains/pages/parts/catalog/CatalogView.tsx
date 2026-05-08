import { CatalogHeader } from "./parts/header/CatalogHeader.js";
import { CatalogMain } from "./parts/main/CatalogMain.js";

export function CatalogView() {
  return (
    <div className="card-column__item" data-type="pages">
      <CatalogHeader />
      <CatalogMain />
    </div>
  );
}
