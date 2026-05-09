import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EditorActionButton } from "./shared/EditorActionButton.js";

export function EditorActionsMore() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="pages-editor__more" ref={rootRef}>
      <EditorActionButton
        ariaLabel="More"
        tooltip="More"
        icon={Ellipsis}
        onClick={() => setIsOpen((open) => !open)}
      />
      {isOpen ? (
        <div className="pages-editor__more-panel" role="menu" aria-label="Page actions">
          <button type="button" className="pages-editor__more-item" role="menuitem">Archive</button>
          <button type="button" className="pages-editor__more-item" role="menuitem">Unpublish</button>
          <button type="button" className="pages-editor__more-item" role="menuitem">Delete</button>
        </div>
      ) : null}
    </div>
  );
}
