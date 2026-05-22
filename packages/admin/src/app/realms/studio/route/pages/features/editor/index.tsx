import { Header } from "./ui/components/Header.js";
import { Main } from "./ui/components/Main.js";
import { useSetup } from "./model/editor.state.js";
import * as React from "react";

export type EditorView = "content" | "seo";

function Editor() {
  useSetup();
  const [view, setView] = React.useState<EditorView>("content");

  return (
    <>
      <div className="card-column__item card-column__item--intrinsic" data-type="properties">
        <Header view={view} onViewChange={setView} />
      </div>
      <div className="card-column__item" data-type="edit">
        <Main view={view} />
      </div>
    </>
  );
}

export { Editor };
