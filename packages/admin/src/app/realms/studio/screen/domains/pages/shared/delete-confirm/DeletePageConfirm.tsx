import { useEffect, useState } from "react";
import { deleteEditorPageById } from "../../parts/editor/services/editorState.js";

interface DeleteRequest {
  id: string;
  title: string;
}

const EVENT_NAME = "atria:pages:confirm-delete";

export function openDeletePageConfirm(id: string, title: string): void {
  window.dispatchEvent(new CustomEvent<DeleteRequest>(EVENT_NAME, { detail: { id, title } }));
}

export function DeletePageConfirm() {
  const [request, setRequest] = useState<DeleteRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onOpen = (event: Event): void => {
      const detail = (event as CustomEvent<DeleteRequest>).detail;
      if (!detail?.id) {
        return;
      }
      setRequest(detail);
    };

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setRequest(null);
      }
    };

    window.addEventListener(EVENT_NAME, onOpen);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener(EVENT_NAME, onOpen);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  if (!request) {
    return null;
  }

  const onCancel = (): void => {
    if (!loading) {
      setRequest(null);
    }
  };

  const onDelete = async (): Promise<void> => {
    setLoading(true);
    const deleted = await deleteEditorPageById(request.id);
    setLoading(false);
    if (deleted) {
      setRequest(null);
    }
  };

  return (
    <div className="pages-delete-confirm" role="dialog" aria-modal="true" aria-label="Delete page confirmation">
      <div className="pages-delete-confirm__backdrop" onClick={onCancel} />
      <div>
        <div className="pages-delete-confirm__card">
          <h3 className="pages-delete-confirm__title">Delete this page?</h3>
          <p className="pages-delete-confirm__text">
            Are you sure you want to permanently delete <strong>{request.title.trim() || "Untitled page"}</strong>?
          </p>
          <div className="pages-delete-confirm__actions">
            <button
              type="button"
              className="button button--solid button--danger button--danger-solid button--sm button--center"
              onClick={onDelete}
              disabled={loading}
            >
              Delete
            </button>
            <button
              type="button"
              className="button button--solid button--sm button--center"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
