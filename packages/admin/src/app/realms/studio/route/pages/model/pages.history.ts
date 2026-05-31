import * as store from "./pages.store.js";

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
    const incomingByType = new Map<string, number>();
    for (const action of incoming.actions) {
      const total = incomingByType.get(action.type) ?? 0;
      incomingByType.set(action.type, total + 1);
    }

    const pending: Array<ActionItem> = [];
    for (const action of optimisticActions) {
      if (knownIds.has(action.id)) {
        continue;
      }

      const byType = incomingByType.get(action.type) ?? 0;
      if (byType > 0) {
        incomingByType.set(action.type, byType - 1);
        continue;
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
