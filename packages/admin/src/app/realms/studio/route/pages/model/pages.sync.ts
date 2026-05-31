import * as repository from "./pages.repository.js";
import * as store from "./pages.store.js";
import type { PageApiPayload } from "./pages.types.js";

type SyncStatus = "idle" | "syncing" | "error";

const queues = new Map<string, Promise<unknown>>();

const setSync = (uuid: string, status: SyncStatus, error: string | null = null): void => {
  const state = store.getState();
  store.setState({
    sync: {
      ...state.sync,
      [uuid]: {
        status,
        error,
      },
    },
  });
};

const enqueue = <T>(uuid: string, task: () => Promise<T>): Promise<T> => {
  const prev = queues.get(uuid) ?? Promise.resolve();
  const next = prev
    .catch(() => undefined)
    .then(async () => {
      setSync(uuid, "syncing");
      try {
        const payload = await task();
        setSync(uuid, "idle");
        return payload;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sync failed";
        setSync(uuid, "error", message);
        throw error;
      }
    });

  queues.set(uuid, next);
  void next.finally(() => {
    if (queues.get(uuid) === next) {
      queues.delete(uuid);
    }
  });

  return next;
};

export const create = (
  id: string,
  title: string,
  slug: string,
  content: string,
): Promise<PageApiPayload | null> => {
  return enqueue(id, () => repository.create(id, title, slug, content));
};

export const update = (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
  versionId?: string | null,
): Promise<PageApiPayload | null> => {
  return enqueue(id, () => repository.update(id, title, slug, content, status, versionId));
};

export const saveVersion = (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
  versionId?: string | null,
): Promise<PageApiPayload | null> => {
  return enqueue(id, () => repository.saveVersion(id, title, slug, content, status, versionId));
};

export const remove = (id: string): Promise<boolean> => {
  return enqueue(id, () => repository.remove(id));
};
