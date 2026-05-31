import * as store from "./pages.store.js";
const historyRequestSeqByPage: Record<string, number> = {};

type ActionItem = {
  id: string;
  type: string;
  createdAt?: string;
  optimistic?: boolean;
  optimisticAt?: number;
};

type VersionItem = {
  versionId: string;
  actions: Array<ActionItem>;
  live: boolean;
};

type PageHistory = {
  versions: Array<VersionItem>;
};

const mergeHistory = (
  currentVersions: Array<VersionItem>,
  incomingVersions: Array<VersionItem>,
): Array<VersionItem> => {
  const now = Date.now();
  const optimisticTtl = 90_000;
  const incomingByVersion = new Map(
    incomingVersions.map((version) => [version.versionId, version]),
  );

  for (const currentVersion of currentVersions) {
    const optimisticActions = currentVersion.actions.filter((action) => (
      action.optimistic === true
      && typeof action.optimisticAt === "number"
      && now - action.optimisticAt < optimisticTtl
    ));
    if (optimisticActions.length === 0) {
      continue;
    }

    const incoming = incomingByVersion.get(currentVersion.versionId);
    if (!incoming) {
      incomingByVersion.set(currentVersion.versionId, {
        versionId: currentVersion.versionId,
        actions: [...optimisticActions],
        live: false,
      });
      continue;
    }

    const knownIds = new Set(incoming.actions.map((action) => action.id));
    const persistedByType = new Map<string, Array<number>>();
    for (const action of incoming.actions) {
      if (!action.createdAt) {
        continue;
      }

      const createdAt = Date.parse(action.createdAt);
      if (!Number.isFinite(createdAt)) {
        continue;
      }

      const list = persistedByType.get(action.type);
      if (list) {
        list.push(createdAt);
      } else {
        persistedByType.set(action.type, [createdAt]);
      }
    }

    for (const list of persistedByType.values()) {
      list.sort((a, b) => b - a);
    }

    const pending: Array<ActionItem> = [];
    for (const action of optimisticActions) {
      if (knownIds.has(action.id)) {
        continue;
      }

      const optimisticAt = action.optimisticAt;
      if (typeof optimisticAt === "number") {
        const candidates = persistedByType.get(action.type) ?? [];
        const candidateIndex = candidates.findIndex((createdAt) => createdAt >= optimisticAt - 15_000);
        if (candidateIndex >= 0) {
          candidates.splice(candidateIndex, 1);
          continue;
        }
      }

      pending.push(action);
    }

    if (pending.length > 0) {
      incoming.actions = [...pending, ...incoming.actions];
    }
  }

  return Array.from(incomingByVersion.values());
};

export const setHistory = (uuid: string, versions: Array<VersionItem>): void => {
  const state = store.getState();
  const currentVersions = state.historyByPage[uuid]?.versions ?? [];
  const merged = mergeHistory(currentVersions, versions.map((version) => ({
    ...version,
    actions: [...version.actions],
  })));
  store.setState({
    historyByPage: {
      ...state.historyByPage,
      [uuid]: { versions: merged },
    },
  });
};

export const nextHistoryRequestSeq = (uuid: string): number => {
  const next = (historyRequestSeqByPage[uuid] ?? 0) + 1;
  historyRequestSeqByPage[uuid] = next;
  return next;
};

export const isLatestHistoryRequestSeq = (uuid: string, seq: number): boolean => {
  return (historyRequestSeqByPage[uuid] ?? 0) === seq;
};
export const addOptimisticAction = (
  uuid: string,
  versionId: string,
  type: string,
): void => {
  const state = store.getState();
  const currentVersions = state.historyByPage[uuid]?.versions ?? [];
  const existing = currentVersions.find((version) => version.versionId === versionId);
  const optimisticAction: ActionItem = {
    id: `optimistic:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`,
    type,
    optimistic: true,
    optimisticAt: Date.now(),
  };

  const versions = existing
    ? currentVersions.map((version) =>
      version.versionId === versionId
        ? { ...version, actions: [optimisticAction, ...version.actions] }
        : version
    )
    : [{ versionId, actions: [optimisticAction], live: false }, ...currentVersions];

  store.setState({
    historyByPage: {
      ...state.historyByPage,
      [uuid]: { versions },
    },
  });
};
