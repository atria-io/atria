import * as React from "react";
import { Header } from "./ui/components/Header.js";
import { Main } from "./ui/components/Main.js";
import { useSetup } from "../../model/pages.state.js";

export type EditorView = "content" | "seo";

function Editor() {
  useSetup();
  const [view, setView] = React.useState<EditorView>("content");

  return (
    <>
      <div className="card-panel" data-type="editor">
        <Header view={view} onViewChange={setView} />
        <Main view={view} />
      </div>
    </>
  );
}

export { Editor };
