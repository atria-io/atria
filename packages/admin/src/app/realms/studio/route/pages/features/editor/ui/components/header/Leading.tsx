import * as deps from "../../deps.js";
import { CloseEditor } from "./CloseEditor.js";
import { Tabs } from "./Tabs.js";

interface LeadingProps {
  onViewChange: (view: deps.EditorView) => void;
  view: deps.EditorView;
}

function Leading({ onViewChange, view }: LeadingProps) {
  const { creating } = deps.useState();
  const route = deps.parse(window.location.pathname);

  if (!creating) {
    if (route.mode === "create" || route.mode === "document") {
      return null;
    }
    return <div>No properties</div>;
  }

  return (
    <div>
      <CloseEditor />
      <Tabs view={view} onViewChange={onViewChange} />
    </div>
  );
}

export { Leading };
