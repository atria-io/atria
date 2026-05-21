import * as Icon from "lucide-react";
import { Button } from "@atria/ui";
import { EditorActionButton } from "./EditorActionButton.js";

interface EditorHeaderToolsProps {
  onClose: () => void;
}

export function EditorHeaderTools({ onClose }: EditorHeaderToolsProps) {
  return (
    <>
      <div className="pages-editor__header-close" aria-label="Close Page">
        <Button
          type="button"
          square
          icon
          variant="overlay"
          aria-label="Close"
          data-tooltip="Close"
          onClick={onClose}
        >
          <Icon.X size={16} />
        </Button>
      </div>
      <div className="pages-editor__header-tools" aria-label="Page tools">
        <Button type="button" size="sm" align="center" variant="overlay" label="Content" />
        <Button type="button" size="sm" align="center" variant={["ghost", "overlay"]} label="SEO" />
        {/*
        <EditorActionButton ariaLabel="History" tooltip="History" icon={Icon.UndoDot} />
        <EditorActionButton ariaLabel="JSON" tooltip="JSON" icon={Icon.Braces} />
        <EditorActionButton ariaLabel="Translate" tooltip="Translate" icon={Icon.Languages} />
        */}
      </div>
    </>
  );
}
