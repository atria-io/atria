import * as React from "react";
import type { CatalogItem } from "./pages.types.js";
import * as state from "./pages.state.js";
import * as archive from "./pages.archive.js";
import { openArchivePage } from "../ui/component/ArchiveDialog.js";
import { openDeletePage } from "../ui/component/DeleteDialog.js";

export const useCatalogActionsMoreModel = (
  item: CatalogItem,
  onOpenChange?: (open: boolean) => void,
): {
  open: boolean;
  confirmArchive: boolean;
  isArchived: boolean;
  isPublished: boolean;
  rootRef: React.MutableRefObject<HTMLDivElement | null>;
  toggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  rootClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  actionClick: (event: React.MouseEvent<HTMLButtonElement>, onClick?: () => void) => void;
  confirm: (event: React.MouseEvent<HTMLButtonElement>) => void;
  requestArchive: () => void;
  close: () => void;
} => {
  const [open, setOpen] = React.useState(false);
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const isArchived = item.status === "archived";
  const isPublished = item.status === "published";

  const close = React.useCallback((): void => {
    setOpen(false);
    setConfirmArchive(false);
  }, []);

  const toggle = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setOpen((current) => {
      if (current) {
        setConfirmArchive(false);
      }
      return !current;
    });
  };

  const rootClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  const actionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    onClick?: () => void,
  ): void => {
    event.stopPropagation();
    onClick?.();
  };

  const requestArchive = (): void => {
    setConfirmArchive(true);
  };

  const confirm = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    close();

    if (isPublished) {
      openArchivePage(item.uuid, item.title);
      return;
    }

    void state.archiveById(item.uuid);
  };

  React.useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onDocumentMouseDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (root.contains(event.target as Node)) {
        return;
      }
      close();
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, [close, open]);

  return {
    open,
    confirmArchive,
    isArchived,
    isPublished,
    rootRef,
    toggle,
    rootClick,
    actionClick,
    confirm,
    requestArchive,
    close,
  };
};

export const useEditorActionsMoreModel = (): {
  creating: boolean;
  currentItem: CatalogItem | null;
  isArchived: boolean;
  isPublished: boolean;
  unarchive: () => void;
  archive: () => void;
  unpublish: () => void;
  openDelete: () => void;
} => {
  const { creating, currentUuid, drafts } = state.useState();
  const currentItem = currentUuid
    ? drafts.find((item) => item.uuid === currentUuid) ?? null
    : null;
  const isArchived = currentItem?.status === "archived";
  const isPublished = currentItem?.status === "published";

  const unarchive = (): void => {
    state.unpublish();
    archive.setArchived(false);
  };

  const archiveCurrent = (): void => {
    if (!currentItem) {
      return;
    }
    if (isPublished) {
      openArchivePage(currentItem.uuid, currentItem.title);
      return;
    }
    state.archive();
  };

  const unpublish = (): void => {
    state.unpublish();
  };

  const openDelete = (): void => {
    if (!currentItem) {
      return;
    }
    openDeletePage(currentItem.uuid, currentItem.title);
  };

  return {
    creating,
    currentItem,
    isArchived,
    isPublished,
    unarchive,
    archive: archiveCurrent,
    unpublish,
    openDelete,
  };
};
