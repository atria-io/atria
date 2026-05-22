import { Button } from "@atria/ui";
import type { EditorView } from "../../index.js";

interface TabsProps {
  onViewChange: (view: EditorView) => void;
  view: EditorView;
}

export function Tabs({ onViewChange, view }: TabsProps) {
  return (
    <>
      <div className="pages-editor__header-tabs" aria-label="Tabs">
        <Button
          type="button"
          size="sm"
          align="center"
          variant={view === "content" ? "overlay" : ["ghost", "overlay"]}
          label="Content"
          onClick={() => onViewChange("content")}
        />
        <Button
          type="button"
          size="sm"
          align="center"
          variant={view === "seo" ? "overlay" : ["ghost", "overlay"]}
          label="SEO"
          onClick={() => onViewChange("seo")}
        />
      </div>
    </>
  );
}
