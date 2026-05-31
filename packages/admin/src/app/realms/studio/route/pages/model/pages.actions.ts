import * as React from "react";
import * as draft from "./pages.draft.js";
import * as history from "./pages.history.js";
import * as session from "./pages.session.js";
import * as state from "./pages.state.js";
import * as store from "./pages.store.js";
import type { ActionsBodyVersion, PageHistoryAction, PageHistoryPayload } from "./pages.types.js";

export const readUrlActionId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const parts = window.location.pathname.split(":");
  const raw = parts.length >= 4 ? parts[3]?.trim() : "";
  if (!raw || raw.startsWith("optimistic")) {
    return null;
  }
  return raw;
};

export const writeUrlActionId = (
  uuid: string,
  versionId: string,
  actionId: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }
  if (actionId.startsWith("optimistic")) {
    return;
  }

  const nextPath = `/pages:${uuid}:${versionId}:${actionId}`;
  if (nextPath === window.location.pathname) {
    return;
  }

  window.history.replaceState({}, "", `${nextPath}${window.location.search}`);
};

export const writeUrlVersionId = (uuid: string, versionId: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const nextPath = `/pages:${uuid}:${versionId}`;
  if (nextPath === window.location.pathname) {
    return;
  }

  window.history.replaceState({}, "", `${nextPath}${window.location.search}`);
};

export const pickAction = (uuid: string, versionId: string, actionId: string): void => {
  if (actionId.startsWith("optimistic")) {
    writeUrlVersionId(uuid, versionId);
  } else {
    writeUrlActionId(uuid, versionId, actionId);
  }
  void draft.loadById(uuid);
};

export const loadHistory = async (uuid: string): Promise<void> => {
  const requestSeq = history.nextHistoryRequestSeq(uuid);
  const response = await fetch(`/api/pages:${uuid}:history`, { method: "GET" });
  if (!history.isLatestHistoryRequestSeq(uuid, requestSeq)) {
    return;
  }
  if (!response.ok) {
    return;
  }

  const payload = (await response.json()) as PageHistoryPayload;
  if (!history.isLatestHistoryRequestSeq(uuid, requestSeq)) {
    return;
  }
  history.setHistory(uuid, Array.isArray(payload?.versions) ? payload.versions : []);
};

export const getActionLabel = (value: string): string => {
  const idx = value.indexOf(":");
  return idx >= 0 ? value.slice(idx + 1) : value;
};

const normalizeActionType = (value: string): string => {
  const idx = value.indexOf(":");
  return idx >= 0 ? value.slice(idx + 1) : value;
};

const sanitizeVersionActions = (actions: Array<PageHistoryAction>): Array<PageHistoryAction> => {
  const publishedIndex = actions.findIndex((action) => normalizeActionType(action.type) === "published");
  if (publishedIndex <= 0) {
    return actions;
  }

  return actions.filter((action, index) => {
    const type = normalizeActionType(action.type);
    if (type !== "updated") {
      return true;
    }

    return index > publishedIndex;
  });
};

export const getActionTimeLabel = (action: PageHistoryAction): string => {
  const timestamp = typeof action.optimisticAt === "number"
    ? action.optimisticAt
    : action.createdAt
      ? Date.parse(action.createdAt)
      : NaN;

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (deltaSeconds < 60) {
    return "Now";
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `${deltaMinutes} min ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours} hr ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays} d ago`;
};

export const getBranchState = (
  canonicalStatus: "draft" | "published" | "archived" | null,
  editorMode: boolean,
  isCurrent: boolean,
  isLive: boolean,
): "LIVE" | "DRAFT" => {
  if (isCurrent && editorMode) {
    return "DRAFT";
  }
  if (canonicalStatus === "published" && isLive) {
    return "LIVE";
  }
  return "DRAFT";
};

export const useActionsBodyModel = (): {
  versions: Array<ActionsBodyVersion>;
  actionId: string | null;
  ready: boolean;
  pick: (versionId: string, actionId: string) => void;
} => {
  const {
    canonicalStatus,
    currentUuid,
    editorMode,
    hasEditorChanges,
    historyByPage,
    switching,
    versionId,
  } = state.useState();
  const historyVersions = currentUuid ? (historyByPage[currentUuid]?.versions ?? []) : [];
  const hasHistoryLoaded = currentUuid ? historyByPage[currentUuid] !== undefined : false;
  const urlActionId = readUrlActionId();
  const [actionId, setActionId] = React.useState<string | null>(readUrlActionId());
  const manualSelectRef = React.useRef(false);
  const resolvingClickRef = React.useRef(false);

  React.useLayoutEffect(() => {
    setActionId(urlActionId);
    manualSelectRef.current = urlActionId !== null;
  }, [currentUuid, versionId, urlActionId]);

  React.useEffect(() => {
    if (!currentUuid) {
      return;
    }
    if (!session.hasId(currentUuid)) {
      return;
    }

    void loadHistory(currentUuid);
  }, [currentUuid, versionId, editorMode, canonicalStatus, hasEditorChanges]);

  React.useEffect(() => {
    if (!hasEditorChanges) {
      return;
    }

    manualSelectRef.current = false;
  }, [hasEditorChanges]);

  React.useEffect(() => {
    if (!currentUuid || !versionId) {
      return;
    }

    if (manualSelectRef.current) {
      return;
    }

    const currentActionId = readUrlActionId();
    if (!currentActionId) {
      return;
    }

    const currentVersion = historyVersions.find((item) => item.versionId === versionId);
    if (!currentVersion || currentVersion.actions.length === 0) {
      return;
    }

    const currentActionIndex = currentVersion.actions.findIndex((action) => action.id === currentActionId);
    const isLatestSelected = currentActionIndex === 0;
    const shouldFollowLatest = hasEditorChanges && isLatestSelected;
    if (!shouldFollowLatest) {
      return;
    }

    writeUrlVersionId(currentUuid, versionId);
    setActionId(null);
  }, [currentUuid, versionId, hasEditorChanges, historyVersions]);

  React.useEffect(() => {
    if (!currentUuid || !versionId) {
      return;
    }

    if (urlActionId === null) {
      if (actionId !== null) {
        setActionId(null);
      }
      return;
    }

    if (actionId !== urlActionId) {
      setActionId(urlActionId);
    }
  }, [currentUuid, versionId, historyVersions, actionId, urlActionId]);

  const fallbackState: "LIVE" | "DRAFT" =
    editorMode || canonicalStatus !== "published" ? "DRAFT" : "LIVE";
  const hasHistory = historyVersions.length > 0;
  const rawVersions = hasHistory
    ? historyVersions
    : versionId
      ? [{ versionId, live: canonicalStatus === "published", actions: [] as Array<PageHistoryAction> }]
      : [];

  const versions: Array<ActionsBodyVersion> = rawVersions
    .filter((version) => version.versionId !== "pending")
    .map((version) => ({
    versionId: version.versionId,
    live: version.live,
    isCurrent: version.versionId === versionId,
    branchState: hasHistory
      ? getBranchState(canonicalStatus, editorMode, version.versionId === versionId, version.live)
      : fallbackState,
    actions: sanitizeVersionActions(version.actions),
    }));
  const currentVersion = versions.find((version) => version.isCurrent);
  const currentHasActions = Boolean(currentVersion && currentVersion.actions.length > 0);
  const currentActionResolved = Boolean(
    currentVersion
    && (
      urlActionId === null
      || (actionId !== null && currentVersion.actions.some((action) => action.id === actionId))
    ),
  );
  const ready = !switching && hasHistoryLoaded && (!currentHasActions || currentActionResolved);

  const pick = (nextVersionId: string, nextActionId: string): void => {
    if (!currentUuid) {
      return;
    }
    if (resolvingClickRef.current) {
      return;
    }

    if (nextVersionId === versionId && nextActionId === actionId) {
      return;
    }

    manualSelectRef.current = true;
    if (!nextActionId.startsWith("optimistic")) {
      pickAction(currentUuid, nextVersionId, nextActionId);
      setActionId(nextActionId);
      return;
    }

    resolvingClickRef.current = true;
    writeUrlVersionId(currentUuid, nextVersionId);
    setActionId(null);
    void draft.loadById(currentUuid);

    const currentVersion = historyVersions.find((item) => item.versionId === nextVersionId);
    const optimisticAction = currentVersion?.actions.find((action) => action.id === nextActionId);
    const optimisticType = optimisticAction?.type ?? null;
    const optimisticAt = optimisticAction?.optimisticAt ?? null;

    const tryResolve = (remaining: number): void => {
      void loadHistory(currentUuid).then(() => {
        const latestState = store.getState();
        const latestVersions = latestState.historyByPage[currentUuid]?.versions ?? [];
        const latestVersion = latestVersions.find((item) => item.versionId === nextVersionId);
        if (!latestVersion) {
          resolvingClickRef.current = false;
          return;
        }

        const persistedCandidates = latestVersion.actions.filter((action) => {
          if (action.optimistic) {
            return false;
          }
          if (optimisticType && action.type !== optimisticType) {
            return false;
          }
          if (typeof optimisticAt === "number" && action.createdAt) {
            const createdAt = Date.parse(action.createdAt);
            if (Number.isFinite(createdAt) && createdAt < optimisticAt - 15_000) {
              return false;
            }
          }
          return true;
        });
        const resolved = typeof optimisticAt === "number"
          ? persistedCandidates
            .map((action) => ({
              action,
              distance: action.createdAt
                ? Math.abs(Date.parse(action.createdAt) - optimisticAt)
                : Number.POSITIVE_INFINITY,
            }))
            .sort((a, b) => a.distance - b.distance)[0]?.action
          : persistedCandidates[0];
        if (resolved) {
          writeUrlActionId(currentUuid, nextVersionId, resolved.id);
          setActionId(resolved.id);
          void draft.loadById(currentUuid);
          resolvingClickRef.current = false;
          return;
        }

        if (remaining <= 0) {
          resolvingClickRef.current = false;
          return;
        }

        window.setTimeout(() => {
          tryResolve(remaining - 1);
        }, 200);
      }).catch(() => {
        resolvingClickRef.current = false;
      });
    };

    tryResolve(2);
  };

  return { versions, actionId, ready, pick };
};
