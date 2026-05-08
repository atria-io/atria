import { Header } from "./parts/header/Header.js";
import { Main } from "./parts/main/Main.js";

export function CatalogView() {
  return (
    <>
      <div className="card-column__item" data-type="pages">
        <Header />
        <Main />
      </div>
    </>
  );
}
