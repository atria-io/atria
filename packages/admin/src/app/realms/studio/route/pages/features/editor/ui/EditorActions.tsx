import * as Icon from "lucide-react";
import {
  archive,
  publish,
  unpublish,
  useState
} from "../model/editor.state.js";
import { ActionsMore } from "../../../shared/ui/ActionsMore.js";
import { openDeletePage } from "../../../shared/ui/DeletePageDialog.js";
import { EditorActionsStatus } from "./EditorActionsStatus.js";
import { EditorActionButton } from "./EditorActionButton.js";
import { parsePagesRoute } from "../../../routes/pages.routes.js";

export function EditorActions() {
  const { creating, currentUuid, drafts, hasEditorChanges } = useState();
  const currentItem = currentUuid ? drafts.find((item) => item.uuid === currentUuid) : null;
  const isArchived = currentItem?.status === "archived";
  const isCreateRoute = parsePagesRoute(window.location.pathname).mode === "create";
  const publishLocked = isCreateRoute && !hasEditorChanges;

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
            ? { key: "unarchive", label: "Unarchive", icon: Icon.Upload, onClick: unpublish }
            : { key: "archive", label: "Archive", icon: Icon.Archive, onClick: archive },
          {
            key: "unpublish",
            label: "Unpublish",
            icon: Icon.EyeOff,
            onClick: unpublish,
            hidden: isArchived || currentItem?.status !== "published",
          },
          {
            key: "delete",
            label: "Delete",
            icon: Icon.Trash2,
            danger: true,
            onClick: () => {
              if (!currentItem) {
                return;
              }
              openDeletePage(currentItem.uuid, currentItem.title);
            },
          },
        ]}
      />
      <EditorActionsStatus />
      <EditorActionButton
        ariaLabel="Publish"
        label="Publish"
        onClick={publishLocked ? undefined : publish}
        accent={!publishLocked}
        disabledPointer={publishLocked}
      />
    </div>
  );
}
