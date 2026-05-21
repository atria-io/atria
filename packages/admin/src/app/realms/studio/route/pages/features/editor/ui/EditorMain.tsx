import * as React from "react";
import { useState } from "../model/editor.state.js";
import { EditorForm } from "./EditorForm.js";

export function EditorMain() {
  const { creating, isResolving } = useState();
  const [showResolveLoading, setShowResolveLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isResolving) {
      setShowResolveLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowResolveLoading(true);
    }, 50);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isResolving]);

  if (isResolving) {
    return (
      <div className="card-column__item" data-type="edit">
        {showResolveLoading ? (
          <div className="atria-boot">
            <div className="atria-boot__spinner" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    );
  }

  if (!creating) {
    return (
      <div className="card-column__item" data-type="edit"></div>
    );
  }

  return (
    <div className="card-column__item" data-type="edit">
      <div>
        <div className="pages-editor pages-editor--edit">
          <div className="pages-editor pages-editor__main">
            <EditorForm />
          </div>
        </div>
      </div>
    </div>
  );
}
