import * as React from "react";
import * as deps from "../deps.js";
import { EditorViewContent } from "./main-content/index.js";
import { EditorViewSEO } from "./main-seo/index.js";

interface MainViewProps {
  children: React.ReactNode;
  view: deps.EditorView;
}

interface MainProps {
  view: deps.EditorView;
}

function MainView({ children, view }: MainViewProps) {
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

function Main({ view }: MainProps) {
  const { creating } = deps.useState();

  if (!creating) {
    return null;
  }

  if (view === "seo") {
    return (
      <MainView view={view}>
        <EditorViewSEO />
      </MainView>
    );
  }

  return (
    <MainView view={view}>
      <EditorViewContent />
    </MainView>
  );
}

export { Main };
