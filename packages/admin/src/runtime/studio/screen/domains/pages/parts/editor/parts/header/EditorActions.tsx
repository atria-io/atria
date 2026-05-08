import { Braces, Languages } from "lucide-react";
import { EditorActionButton } from "./shared/EditorActionButton.js";

export function EditorActions() {
  return (
    <div className="pages-editor__header-action">
      <div className="pages-editor__header-tools" aria-label="Page tools">
        <EditorActionButton ariaLabel="Translate" tooltip="Translate" icon={Languages} />
        <EditorActionButton ariaLabel="JSON" tooltip="JSON" icon={Braces} />
      </div>
      <EditorActionButton ariaLabel="Publish" label="Publish" />
    </div>
  );
}
