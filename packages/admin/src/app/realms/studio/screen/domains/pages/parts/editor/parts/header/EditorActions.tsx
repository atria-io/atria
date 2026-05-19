import {
  archiveEditorPage,
  publishEditorPage,
  unpublishEditorPage,
  useEditorState
} from "../../services/editorState.js";
import { Archive, EyeOff, Trash2, Upload } from "lucide-react";
import { ActionsMore } from "../../../../shared/actions-more/ActionsMore.js";
import { openDeletePageConfirm } from "../../../../shared/delete-confirm/DeletePageConfirm.js";
import { EditorActionsStatus } from "./EditorActionsStatus.js";
import { EditorActionButton } from "./shared/EditorActionButton.js";

export function EditorActions() {
  const { creating, currentUuid, drafts } = useEditorState();
  const currentItem = currentUuid ? drafts.find((item) => item.uuid === currentUuid) : null;
  const isArchived = currentItem?.status === "archived";

  if (!creating) {
    return null;
  }

  return (
    <div className="pages-editor__header-action">
      <ActionsMore
        panelId="pages-editor-more-panel-menu"
        variant="editor"
        items={[
          isArchived
            ? { key: "unarchive", label: "Unarchive", icon: Upload, onClick: unpublishEditorPage }
            : { key: "archive", label: "Archive", icon: Archive, onClick: archiveEditorPage },
          {
            key: "unpublish",
            label: "Unpublish",
            icon: EyeOff,
            onClick: unpublishEditorPage,
            hidden: isArchived || currentItem?.status !== "published",
          },
          {
            key: "delete",
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => {
              if (!currentItem) {
                return;
              }
              openDeletePageConfirm(currentItem.uuid, currentItem.title);
            },
          },
        ]}
      />
      <EditorActionsStatus />
      <EditorActionButton ariaLabel="Publish" label="Publish" onClick={publishEditorPage} />
    </div>
  );
}
