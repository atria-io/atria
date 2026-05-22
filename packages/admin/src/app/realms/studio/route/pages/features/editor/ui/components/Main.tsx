import * as React from "react";
import { useState } from "../../model/editor.state.js";
import { EditorViewContent } from "./main-content/index.js";
import { EditorViewSEO } from "./main-seo/index.js";
import type { EditorView } from "../../index.js";

interface EditorMainViewProps {
  children: React.ReactNode;
  view: EditorView;
}

interface EditorMainProps {
  view: EditorView;
}

function EditorMainView({ children, view }: EditorMainViewProps) {
  return (
    <div className="card-column pages-editor__view" data-view={view}>
      <div className="pages-editor pages-editor__main">
        <div className="pages-editor pages-editor--edit">
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

function EditorMain({ view }: EditorMainProps) {
  const { creating } = useState();

  if (!creating) {
    return null;
  }

  if (view === "seo") {
    return (
      <EditorMainView view={view}>
        <EditorViewSEO />
      </EditorMainView>
    );
  }

  return (
    <EditorMainView view={view}>
      <EditorViewContent />
    </EditorMainView>
  );
}

export { EditorMain };
