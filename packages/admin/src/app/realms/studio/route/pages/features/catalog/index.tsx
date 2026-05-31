import { Header } from "./ui/components/Header.js";
import { Search } from "./ui/components/Search.js";
import { Main } from "./ui/components/Main.js";

export function Catalog() {
  return (
    <div className="card-panel" data-type="catalog">
      <div className="card-strip">
        <Header />
      </div>
      <div className="card-stage">
        <Search />
        <Main />
      </div>
    </div>
  );
}
