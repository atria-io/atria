import { useState } from "../model/editor.state.js";
import { EditorHeaderTools } from "./EditorHeaderTools.js";

export function EditorHeaderLeading() {
  const { creating, title } = useState();

  const onClose = (): void => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  if (!creating) {
    return <div>No properties</div>;
  }

  return (
    <div className="pages-editor__header-leading">
      <EditorHeaderTools onClose={onClose} />
    </div>
  );
}
