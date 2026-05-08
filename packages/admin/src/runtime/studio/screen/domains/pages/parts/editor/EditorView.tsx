import { Header } from "./parts/header/Header.js";
import { Main } from "./parts/main/Main.js";

export function EditorView() {
  return (
    <div className="card-column__item" data-type="properties">
      <Header />
      <Main />
    </div>
  );
}
