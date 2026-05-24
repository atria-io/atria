import * as React from "react";
import * as Dialog from "@atria/ui";
import { Button, useDialog } from "@atria/ui";
import { archiveById } from "../../model/pages.state.js";

interface ArchiveRequest {
  id: string;
  title: string;
}

const EVENT_NAME = "atria:pages:confirm-archive-live";

function openArchivePage(id: string, title: string): void {
  window.dispatchEvent(
    new CustomEvent<ArchiveRequest>(EVENT_NAME, {
      detail: {
        id,
        title,
      },
    }),
  );
}

function ArchiveDialog() {
  const [request, setRequest] = React.useState<ArchiveRequest | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onClose = React.useCallback((): void => {
    if (!loading) {
      setRequest(null);
    }
  }, [loading]);

  React.useEffect(() => {
    const onOpen = (event: Event): void => {
      const detail = (event as CustomEvent<ArchiveRequest>).detail;
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

  const truncatedTitle = title.length > 25
    ? `${title.slice(0, 25)}…`
    : title;

  const onArchive = React.useCallback(async (): Promise<void> => {
    if (!request) {
      return;
    }

    setLoading(true);
    const updated = await archiveById(request.id);
    setLoading(false);

    if (!updated) {
      return;
    }

    setRequest(null);
  }, [request]);

  return (
    <Dialog.Dialog
      aria-label="Archive live page confirmation"
      size="sm"
      open={open}
      mounted={mounted}
      onBackdropClick={onBackdropClick}
    >
      <Dialog.DialogHeader>Archive this page?</Dialog.DialogHeader>
      <Dialog.DialogBody>
        <span className="dialog__inline-label" title={title}><strong>{truncatedTitle}</strong></span> is currently <span style={{ color: "var(--valid)" }}><strong>LIVE</strong></span>. Archiving will unpublish this page.
      </Dialog.DialogBody>
      <Dialog.DialogFooter>
        <Button
          type="button"
          variant={["solid", "danger_hover"]}
          size="sm"
          onClick={() => void onArchive()}
          disabled={loading}
          aria-label="Archive"
          label="Confirm"
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

export { ArchiveDialog, openArchivePage };
