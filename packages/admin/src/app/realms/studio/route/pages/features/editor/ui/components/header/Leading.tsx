import * as deps from "../../deps.js";
import { CloseEditor } from "./CloseEditor.js";
import { Tabs } from "./Tabs.js";

interface LeadingProps {
  onViewChange: (view: deps.EditorView) => void;
  view: deps.EditorView;
}

function Leading({ onViewChange, view }: LeadingProps) {
  const { creating } = deps.useState();

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

export { Leading };
