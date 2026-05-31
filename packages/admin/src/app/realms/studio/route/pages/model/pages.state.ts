import * as React from "react";
import * as model from "./pages.model.js";
import { popstate } from "@/app/system/hooks/popstate.js";
import { getState, subscribe } from "./pages.store.js";
export {
  parsePagesRoute,
  resolveCreatePath,
  resolveDocumentPath,
} from "../routes/pages.routes.js";

export type { CatalogItem, EditorState } from "./pages.types.js";

export const useState = () =>
  React.useSyncExternalStore(
    subscribe,
    getState
  );

export const getSyncState = (uuid: string): { status: "idle" | "syncing" | "error"; error: string | null } => {
  return getState().sync[uuid] ?? { status: "idle", error: null };
};

export const useSetup = (): void => {
  const sync = React.useCallback((): void => {
    model.sync();
  }, []);

  popstate(sync);

  React.useEffect(() => {
    sync();
  }, [sync]);
};

export const setTitle = (title: string): void => {
  model.setTitle(title);
};

export const commitTitleBlurOnCreate = (title: string): void => {
  model.commitTitleBlurOnCreate(title);
};

export const commitEditorChanges = (): void => {
  model.commitEditorChanges();
};

export const loadById = async (uuid: string): Promise<boolean> => {
  return model.loadById(uuid);
};

export const reloadCatalog = async (): Promise<void> => {
  await model.load();
};

export const setSlug = (slug: string): void => {
  model.setSlug(slug);
};

export const setContent = (content: string): void => {
  model.setContent(content);
};

export const applySlugFromTitle = (title?: string): void => {
  model.applySlugFromTitle(title);
};

export const startCreate = (): void => {
  model.startCreate();
};

export const publish = (): void => {
  model.publish();
};

export const unpublish = (): void => {
  model.unpublish();
};

export const archive = (): void => {
  model.archive();
};

export const archiveById = async (uuid: string): Promise<boolean> => {
  return model.archiveById(uuid);
};

export const publishById = async (uuid: string): Promise<boolean> => {
  return model.publishById(uuid);
};

export const unpublishById = async (uuid: string): Promise<boolean> => {
  return model.unpublishById(uuid);
};

export const deleteById = (uuid: string): Promise<boolean> => {
  return model.deleteById(uuid);
};
