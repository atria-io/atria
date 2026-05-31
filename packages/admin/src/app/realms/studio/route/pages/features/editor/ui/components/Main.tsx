import * as deps from "../deps.js";
import { SEO } from "./main/SEO.js";
import { Content } from "./main/Content.js";
import { Status } from "./main/Status.js";
import { Settings } from "./Settings.js";

interface MainProps {
  view: deps.EditorView;
}

function Editor({ view }: { view: deps.EditorView }) {
  return view === "seo" ? <SEO /> : <Content />;
}

function Body({ view }: { view: deps.EditorView }) {
  return (
    <div className="card-stage" data-tab={view}>
      <Status />
      <Editor view={view} />
    </div>
  );
}

function Main({ view }: MainProps) {
  const { creating } = deps.useState();

  if (!creating) {
    return (
      <>
        <div className="card-row">
          <div className="card-column" data-view="editing"></div>
          <div className="card-column"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="card-row">
        <div className="card-column" data-view="editing">
          <Body view={view} />
        </div>
        <div className="card-column" data-view="metadata">
          <Settings />
        </div>
      </div>
    </>
  );
}

export { Main };
