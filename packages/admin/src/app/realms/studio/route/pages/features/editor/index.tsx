import * as React from "react";
import { Header } from "./ui/components/Header.js";
import { Main } from "./ui/components/Main.js";
import { useSetup } from "./model/editor.state.js";

export type EditorView = "content" | "seo";

function Editor() {
  useSetup();
  const [view, setView] = React.useState<EditorView>("content");

  return (
    <>
      <div className="card-column__item card-column__item--shrink">
        <Header view={view} onViewChange={setView} />
      </div>
      <div className="card-column__item">
        <Main view={view} />
      </div>
    </>
  );
}

export { Editor };
