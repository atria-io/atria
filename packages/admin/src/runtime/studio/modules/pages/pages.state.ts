import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPage,
  deletePage,
  getFolders,
  getPage,
  listPages,
  listVersions,
  patchFolder,
  patchPage,
  publishPage,
  unpublishPage,
} from "./api/pages.api.js";
import type {
  CreatePagePayload,
  FolderNode,
  PageDocument,
  PageListItem,
  PageVersionSummary,
} from "./pages.types.js";

type PagesMode = "create" | "document";

interface PagesRouteState {
  mode: PagesMode;
  uuid: string | null;
  versionId: string | null;
}

const toNonEmpty = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const parsePagesRoute = (): PagesRouteState => {
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  if (!pathname.startsWith("/pages")) {
    return { mode: "document", uuid: null, versionId: null };
  }

  const matrix = pathname.slice("/pages".length);
  if (matrix === ";create") {
    return { mode: "create", uuid: null, versionId: null };
  }

  if (matrix.startsWith(";")) {
    return {
      mode: "document",
      uuid: toNonEmpty(matrix.slice(1)),
      versionId: toNonEmpty(url.searchParams.get("version")),
    };
  }

  return { mode: "document", uuid: null, versionId: null };
};

const pushPagesPath = (path: string): void => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export interface PagesState {
  route: PagesRouteState;
  items: PageListItem[];
  folders: FolderNode[];
  selectedFolderId: string | null;
  selectedPage: PageDocument | null;
  versions: PageVersionSummary[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  openCreate: () => void;
  openPage: (uuid: string) => void;
  createDraft: (payload: CreatePagePayload) => Promise<void>;
  saveDraft: (patch: { title?: string; draftSlug?: string; template?: string }) => Promise<void>;
  publish: () => Promise<void>;
  unpublish: () => Promise<void>;
  remove: () => Promise<void>;
  changeFolderFilter: (folderId: string | null) => Promise<void>;
  assignFolder: (pageUuid: string, folderId: string | null) => Promise<void>;
}

export const usePagesState = (): PagesState => {
  const [route, setRoute] = useState<PagesRouteState>(() => parsePagesRoute());
  const [items, setItems] = useState<PageListItem[]>([]);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageDocument | null>(null);
  const [versions, setVersions] = useState<PageVersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [nextItems, workspaceFolders] = await Promise.all([
        listPages({ locale: "default", folderId: selectedFolderId }),
        getFolders(),
      ]);
      setItems(nextItems);
      setFolders(workspaceFolders.folders);

      if (route.mode === "document" && route.uuid) {
        const [page, pageVersions] = await Promise.all([
          getPage(route.uuid, { locale: "default", versionId: route.versionId }),
          listVersions(route.uuid),
        ]);
        setSelectedPage(page);
        setVersions(pageVersions);
      } else {
        setSelectedPage(null);
        setVersions([]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [route.mode, route.uuid, route.versionId, selectedFolderId]);

  useEffect(() => {
    const onPopState = (): void => setRoute(parsePagesRoute());
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openCreate = useCallback(() => {
    pushPagesPath("/pages;create");
  }, []);

  const openPage = useCallback((uuid: string) => {
    pushPagesPath(`/pages;${uuid}`);
  }, []);

  const createDraftHandler = useCallback(async (payload: CreatePagePayload): Promise<void> => {
    const created = await createPage(payload);
    pushPagesPath(`/pages;${created.uuid}`);
  }, []);

  const saveDraft = useCallback(async (patch: { title?: string; draftSlug?: string; template?: string }): Promise<void> => {
    if (!route.uuid) {
      return;
    }
    await patchPage(route.uuid, patch);
    await reload();
  }, [reload, route.uuid]);

  const publish = useCallback(async (): Promise<void> => {
    if (!route.uuid) {
      return;
    }
    await publishPage(route.uuid);
    await reload();
  }, [reload, route.uuid]);

  const unpublish = useCallback(async (): Promise<void> => {
    if (!route.uuid) {
      return;
    }
    await unpublishPage(route.uuid);
    await reload();
  }, [reload, route.uuid]);

  const remove = useCallback(async (): Promise<void> => {
    if (!route.uuid) {
      return;
    }
    await deletePage(route.uuid);
    pushPagesPath("/pages");
  }, [route.uuid]);

  const changeFolderFilter = useCallback(async (folderId: string | null): Promise<void> => {
    setSelectedFolderId(folderId);
  }, []);

  const assignFolder = useCallback(async (pageUuid: string, folderId: string | null): Promise<void> => {
    await patchFolder(pageUuid, folderId);
    await reload();
  }, [reload]);

  return useMemo(
    () => ({
      route,
      items,
      folders,
      selectedFolderId,
      selectedPage,
      versions,
      loading,
      error,
      reload,
      openCreate,
      openPage,
      createDraft: createDraftHandler,
      saveDraft,
      publish,
      unpublish,
      remove,
      changeFolderFilter,
      assignFolder,
    }),
    [
      route,
      items,
      folders,
      selectedFolderId,
      selectedPage,
      versions,
      loading,
      error,
      reload,
      openCreate,
      openPage,
      createDraftHandler,
      saveDraft,
      publish,
      unpublish,
      remove,
      changeFolderFilter,
      assignFolder,
    ]
  );
};
