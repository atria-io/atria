import { Header } from "./parts/header/Header.js";
import { Main } from "./parts/main/Main.js";

interface EditorViewProps {
  creating: boolean;
}

export function EditorView({ creating }: EditorViewProps) {
  return (
    <div className="card-column__item" data-type="properties">
      <Header creating={creating} />
      <Main creating={creating} />
    </div>
  );
}
