import { useState } from "../../model/editor.state.js";
import type { EditorView } from "../../index.js";
import { CloseEditor } from "./CloseEditor.js";
import { Tabs } from "./Tabs.js";

interface LeadingProps {
  onViewChange: (view: EditorView) => void;
  view: EditorView;
}

export function Leading({ onViewChange, view }: LeadingProps) {
  const { creating } = useState();

  if (!creating) {
    return <div>No properties</div>;
  }

  return (
    <div className="pages-editor__header-leading">
      <CloseEditor />
      <Tabs view={view} onViewChange={onViewChange} />
    </div>
  );
}
