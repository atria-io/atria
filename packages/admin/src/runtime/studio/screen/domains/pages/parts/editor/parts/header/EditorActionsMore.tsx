import { useRef } from "react";
import { Archive, Ellipsis, EyeOff, Trash2, Upload } from "lucide-react";
import { usePopoverState } from "@/runtime/studio/chrome/header/parts/actions/account/service/usePopoverState.js";
import { archiveEditorPage, unpublishEditorPage, useEditorState } from "../../services/editorState.js";

const PANEL_ID = "pages-editor-more-panel-menu";

export function EditorActionsMore() {
  const { currentUuid, drafts } = useEditorState();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = usePopoverState(rootRef);
  const currentItem = currentUuid ? drafts.find((item) => item.uuid === currentUuid) : null;
  const isArchived = currentItem?.status === "archived";

  return (
    <div className="pages-editor__more" ref={rootRef}>
      <button
        type="button"
        className="button button--square button--overlay button--has-icon"
        aria-label="More"
        aria-haspopup="menu"
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        data-tooltip="More"
        onClick={togglePanel}
      >
        <div className="button__icon">
          <Ellipsis size={16} />
        </div>
      </button>

      {isMounted ? (
        <div
          id={PANEL_ID}
          className={
            !isClosing
              ? "pages-editor__more-panel pages-editor__more-panel--open"
              : "pages-editor__more-panel pages-editor__more-panel--closing"
          }
          onAnimationEnd={onPanelAnimationEnd}
        >
          <div className="pages-editor__more-menu">
            <div className="pages-editor__more-menu-content" aria-label="Page actions">
              {isArchived ? (
                <button
                  type="button"
                  className="button button--square button--overlay button--has-icon button--start"
                  role="menuitem"
                  onClick={unpublishEditorPage}
                >
                  <span className="button__icon" aria-hidden="true"><Upload size={13} /></span>
                  <span className="button__label pages-editor__more-panel-label">Unarchive</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="button button--square button--overlay button--has-icon button--start"
                  role="menuitem"
                  onClick={archiveEditorPage}
                >
                  <span className="button__icon" aria-hidden="true"><Archive size={13} /></span>
                  <span className="button__label pages-editor__more-panel-label">Archive</span>
                </button>
              )}
              {!isArchived ? (
                <button
                  type="button"
                  className="button button--square button--overlay button--has-icon button--start"
                  role="menuitem"
                  onClick={unpublishEditorPage}
                >
                  <span className="button__icon" aria-hidden="true"><EyeOff size={13} /></span>
                  <span className="button__label pages-editor__more-panel-label">Unpublish</span>
                </button>
              ) : null}
              <button type="button" className="button button--danger-hover button--overlay button--square button--has-icon button--start" role="menuitem">
                <span className="button__icon" aria-hidden="true"><Trash2 size={13} /></span>
                <span className="button__label pages-editor__more-panel-label">Delete</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
