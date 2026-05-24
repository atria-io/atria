import * as React from "react";
import * as Dialog from "@atria/ui";
import { Button } from "@atria/ui";
import { useDialog } from "@atria/ui";
import { deleteById } from "../../model/pages.state.js";

interface DeleteRequest {
  id: string;
  title: string;
}

const EVENT_NAME = "atria:pages:confirm-delete";

function openDeletePage(id: string, title: string): void {
  window.dispatchEvent(
    new CustomEvent<DeleteRequest>(EVENT_NAME, {
      detail: {
        id,
        title
      }
    })
  );
}

function DeleteDialog() {
  const [request, setRequest] = React.useState<DeleteRequest | null>(null);
  const [loading, setLoading] = React.useState(false);
  const onClose = React.useCallback((): void => {
    if (!loading) {
      setRequest(null);
    }
  }, [loading]);
  React.useEffect(() => {
    const onOpen = (event: Event): void => {
      const detail = (event as CustomEvent<DeleteRequest>).detail;
      if (!detail?.id) {
        return;
      }
      setRequest(detail);
    };
    window.addEventListener(EVENT_NAME, onOpen);
    return () => {
      window.removeEventListener(EVENT_NAME, onOpen);
    };
  }, []);
  const { open, mounted, onBackdropClick } = useDialog({
    value: request,
    disabled: loading,
    onClose,
  });
  const title = (request?.title ?? "").trim() || "Untitled";
  const onDelete = React.useCallback(async (): Promise<void> => {
    if (!request) {
      return;
    }
    setLoading(true);
    const deleted = await deleteById(request.id);
    setLoading(false);
    if (deleted) {
      setRequest(null);
    }
  }, [request]);

  return (
    <Dialog.Dialog
      aria-label="Delete page confirmation"
      variant="destructive"
      size="sm"
      open={open}
      mounted={mounted}
      onBackdropClick={onBackdropClick}
    >
      <Dialog.DialogHeader>
        Delete this page?
      </Dialog.DialogHeader>
      <Dialog.DialogBody>
        Are you sure you want to permanently delete <strong>{title}</strong>?
      </Dialog.DialogBody>
      <Dialog.DialogFooter>
        <Button
          type="button"
          variant={["solid", "destructive"]}
          size="sm"
          onClick={() => void onDelete()}
          disabled={loading}
          label="Delete"
        />
        <Button
          type="button"
          variant="solid"
          size="sm"
          onClick={onClose}
          disabled={loading}
          label="Cancel"
        />
      </Dialog.DialogFooter>
    </Dialog.Dialog>
  );
}

export { DeleteDialog, openDeletePage };
