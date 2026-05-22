import { Header } from "./ui/components/Header.js";
import { Search } from "./ui/components/Search.js";
import { Main } from "./ui/components/Main.js";

export function Catalog() {
  return (
    <div className="card-column__item" data-type="catalog">
      <div className="card-screen">
        <div className="pages-catalog">
          <Header />
          <Search />
          <Main />
        </div>
      </div>
    </div>
  );
}
