import { Header } from "./parts/header/Header.js";
import { Main } from "./parts/main/Main.js";

interface CatalogViewProps {
  onCreatePage: () => void;
}

export function CatalogView({ onCreatePage }: CatalogViewProps) {
  return (
    <div className="card-column__item" data-type="pages">
      <Header onCreatePage={onCreatePage} />
      <Main />
    </div>
  );
}
