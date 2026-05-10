import { Braces, UndoDot, Languages, X } from "lucide-react";
import { EditorActionButton } from "./shared/EditorActionButton.js";

interface EditorHeaderToolsProps {
  onClose: () => void;
}

export function EditorHeaderTools({ onClose }: EditorHeaderToolsProps) {
  return (
    <div className="pages-editor__header-tools" aria-label="Page tools">
      <EditorActionButton ariaLabel="Close" tooltip="Close" icon={X} onClick={onClose} />
      <EditorActionButton ariaLabel="History" tooltip="History" icon={UndoDot} />
      <EditorActionButton ariaLabel="JSON" tooltip="JSON" icon={Braces} />
      <EditorActionButton ariaLabel="Translate" tooltip="Translate" icon={Languages} />
    </div>
  );
}
