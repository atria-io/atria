import { EditorForm } from "./EditorForm.js";
import type { MainProps } from "./types.js";

export function EditorMain({ creating }: MainProps) {
  if (!creating) {
    return <div />;
  }

  return (
    <div className="card-screen">
      <div className="editor-main">
        <EditorForm />
      </div>
    </div>
  );
}
