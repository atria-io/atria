import * as React from "react";
import * as deps from "../deps.js";
import { Content } from "./main-content/index.js";
import { Settings } from "./main-settings/index.js";
import { SEO } from "./main-seo/index.js";

interface MainViewProps {
  children: React.ReactNode;
  view: deps.EditorView;
}

interface MainProps {
  view: deps.EditorView;
}

function MainView({ children, view }: MainViewProps) {
  return (
    <>
      <div className="card-row">
        <div className="card-row__item" data-view={view} data-type="edit">
          <div className="pages-editor pages-editor__content">
            <div className="pages-editor pages-editor--edit">
              <div>{children}</div>
            </div>
          </div>
        </div>
        <div className="card-row__item" data-view="settings">
          <div className="card-screen">
            <div className="pages-editor pages-editor__settings">
              <Settings />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Main({ view }: MainProps) {
  const { creating } = deps.useState();

  if (!creating) {
    return (
      <>
        <div className="card-row">
          <div className="card-row__item" data-type="edit"></div>
          <div className="card-row__item"></div>
        </div>
      </>
    )
  }

  if (view === "seo") {
    return (
      <MainView view={view}>
        <SEO />
      </MainView>
    );
  }

  return (
    <MainView view={view}>
      <Content />
    </MainView>
  );
}

export { Main };
