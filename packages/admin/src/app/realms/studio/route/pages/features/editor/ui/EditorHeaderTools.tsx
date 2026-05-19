import * as Icon from "lucide-react";
import { EditorActionButton } from "./EditorActionButton.js";

interface EditorHeaderToolsProps {
  onClose: () => void;
}

export function EditorHeaderTools({ onClose }: EditorHeaderToolsProps) {
  return (
    <>
      <div className="pages-editor__header-close" aria-label="Close Page">
        <EditorActionButton ariaLabel="Close" tooltip="Close" icon={Icon.X} onClick={onClose} />
      </div>
      <div className="pages-editor__header-tools" aria-label="Page tools">
        <button className="button button--sm button--overlay button--center">Content</button>
        <button className="button button--ghost button--sm button--overlay button--center">SEO</button>
        <button className="button button--ghost button--sm button--overlay button--center">Schema</button>
        {/*
        <EditorActionButton ariaLabel="History" tooltip="History" icon={Icon.UndoDot} />
        <EditorActionButton ariaLabel="JSON" tooltip="JSON" icon={Icon.Braces} />
        <EditorActionButton ariaLabel="Translate" tooltip="Translate" icon={Icon.Languages} />
        */}
      </div>
    </>
  );
}
