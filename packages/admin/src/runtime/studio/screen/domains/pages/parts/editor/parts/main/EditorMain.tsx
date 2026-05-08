import type { MainProps } from "./types.js";
import { EditorForm } from "./EditorForm.js";

export function EditorMain({ creating }: MainProps) {
  if (!creating) {
    return <div className="card-screen"><div className="editor-main" /></div>;
  }

  return (
    <div className="card-screen">
      <div className="editor-main">
        <EditorForm />
      </div>
    </div>
  );
}
