import * as React from "react";

interface UseCardCollapseInput {
  initialCollapsed?: boolean;
  initialHeight?: number;
  initialHeightRatio?: number;
  minHeight?: number;
  expandedMinHeight?: number;
  fixedCollapsed?: boolean;
  clearStyleOnExpand?: boolean;
  storageKey: string;
}

interface PanelState {
  collapsed: boolean;
  height: number;
}

const STORAGE_NAMESPACE = "atria:collapse";

const applyPanelState = (
  panel: HTMLDivElement | null,
  state: PanelState,
  minHeight: number,
  fixedCollapsed: boolean,
  clearStyleOnExpand: boolean,
  allowClearOnExpand: boolean,
): void => {
  if (!panel) {
    return;
  }

  panel.removeAttribute("collapsed");
  const strip = panel.querySelector<HTMLDivElement>(".card-strip");
  if (strip) {
    if (state.collapsed) {
      strip.classList.add("card-strip--closed");
    } else {
      strip.classList.remove("card-strip--closed");
    }
  }
  if (!state.collapsed && (fixedCollapsed || (clearStyleOnExpand && allowClearOnExpand))) {
    panel.style.flex = "";
    panel.style.height = "";
    return;
  }

  panel.style.flex = "0 0 auto";
  panel.style.height = `${state.collapsed ? minHeight : state.height}px`;
};

const readState = (
  storageKey: string,
  fallback: PanelState,
): PanelState => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const saved = window.localStorage.getItem(STORAGE_NAMESPACE);
  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved) as Record<string, Partial<PanelState>>;
    const entry = parsed[storageKey];
    if (!entry || typeof entry !== "object") {
      return fallback;
    }

    const height = typeof entry.height === "number" ? entry.height : fallback.height;
    const collapsed = entry.collapsed === true;
    return { collapsed, height };
  } catch {
    return fallback;
  }
};

const writeState = (storageKey: string, state: PanelState): void => {
  if (typeof window === "undefined") {
    return;
  }

  let next: Record<string, PanelState> = {};
  const saved = window.localStorage.getItem(STORAGE_NAMESPACE);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, PanelState>;
      if (parsed && typeof parsed === "object") {
        next = parsed;
      }
    } catch {
      next = {};
    }
  }

  next[storageKey] = state;
  window.localStorage.setItem(STORAGE_NAMESPACE, JSON.stringify(next));
};

const readLegacyState = (
  storageKey: string,
  fallback: PanelState,
): PanelState => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<PanelState>;
    const height = typeof parsed.height === "number" ? parsed.height : fallback.height;
    const collapsed = parsed.collapsed === true;
    return { collapsed, height };
  } catch {
    return fallback;
  }
};

/**
 * Enables panel collapse/expand and vertical resize using the panel's `.card-strip`.
 *
 * Example:
 * useCardCollapse({
 *   storageKey: "pages:editor:metadata:actions:collapse",
 *   initialCollapsed: false,   // default false
 *   initialHeight: 240,        // default 240px
 *   initialHeightRatio: 0.4,   // optional (0..1), e.g. 40% of parent
 *   minHeight: 48,             // default 48px
 *   expandedMinHeight: 120,    // default 120px
 *   fixedCollapsed: false,     // default false
 *   clearStyleOnExpand: true,  // default false
 * })
 */
export const useCardCollapse = (
  input: UseCardCollapseInput,
): {
  panelRef: React.RefObject<HTMLDivElement | null>;
} => {
  const {
    initialCollapsed = false,
    initialHeight = 240,
    initialHeightRatio,
    minHeight = 48,
    expandedMinHeight = 120,
    fixedCollapsed = false,
    clearStyleOnExpand = false,
    storageKey,
  } = input;
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const expandedHeightRef = React.useRef<number>(Math.max(initialHeight, minHeight));

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const parentHeight = panel.parentElement?.getBoundingClientRect().height ?? 0;
    const ratioHeight = typeof initialHeightRatio === "number"
      ? Math.max(0, Math.min(1, initialHeightRatio)) * parentHeight
      : 0;
    const resolvedInitialHeight = ratioHeight > 0 ? ratioHeight : initialHeight;

    const fallback: PanelState = {
      collapsed: initialCollapsed,
      height: Math.max(resolvedInitialHeight, minHeight, expandedMinHeight),
    };
    const state = readState(storageKey, readLegacyState(storageKey, fallback));
    expandedHeightRef.current = Math.max(state.height, minHeight, expandedMinHeight);
    applyPanelState(panel, state, minHeight, fixedCollapsed, clearStyleOnExpand, false);
  }, [clearStyleOnExpand, expandedMinHeight, fixedCollapsed, initialCollapsed, initialHeight, initialHeightRatio, minHeight, storageKey]);

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const strip = panel.querySelector<HTMLDivElement>(".card-strip");
    if (!strip) {
      return;
    }

    const onDblClick = (): void => {
      const currentHeight = panel.getBoundingClientRect().height || Math.max(initialHeight, minHeight);
      const isCollapsed = Math.round(currentHeight) <= minHeight;
      if (!isCollapsed) {
        expandedHeightRef.current = Math.max(currentHeight, minHeight, expandedMinHeight);
      }
      const fallbackExpanded = Math.max(expandedHeightRef.current, minHeight, expandedMinHeight);
      const next: PanelState = {
        collapsed: !isCollapsed,
        height: isCollapsed ? fallbackExpanded : Math.max(currentHeight, minHeight),
      };

      applyPanelState(panel, next, minHeight, fixedCollapsed, clearStyleOnExpand, isCollapsed);
      writeState(storageKey, next);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      strip.setAttribute("dragging", "");
      const startY = event.clientY;
      const startHeight = panel.getBoundingClientRect().height;
      const column = panel.parentElement;
      const columnHeight = column?.getBoundingClientRect().height ?? Number.MAX_SAFE_INTEGER;
      const siblingReserve = column
        ? Array.from(column.children)
          .filter((node) => node !== panel)
          .reduce((sum, node) => {
            if (!(node instanceof HTMLDivElement)) {
              return sum;
            }

            const siblingStrip = node.querySelector<HTMLDivElement>(".card-strip");
            const siblingMin = siblingStrip?.getBoundingClientRect().height ?? minHeight;
            return sum + Math.max(siblingMin, minHeight);
          }, 0)
        : 0;
      const maxHeight = Math.max(minHeight, columnHeight - siblingReserve);

      const onPointerMove = (moveEvent: PointerEvent): void => {
        const delta = startY - moveEvent.clientY;
        const nextHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + delta));
        expandedHeightRef.current = nextHeight;
        const next: PanelState = {
          collapsed: false,
          height: nextHeight,
        };
        applyPanelState(panel, next, minHeight, fixedCollapsed, clearStyleOnExpand, false);
      };

      const onPointerUp = (): void => {
        const currentHeight = panel.getBoundingClientRect().height || Math.max(initialHeight, minHeight);
        const next: PanelState = {
          collapsed: Math.round(currentHeight) <= minHeight,
          height: Math.max(currentHeight, minHeight),
        };
        applyPanelState(panel, next, minHeight, fixedCollapsed, clearStyleOnExpand, false);
        writeState(storageKey, next);
        strip.removeAttribute("dragging");
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };

    strip.addEventListener("dblclick", onDblClick);
    strip.addEventListener("pointerdown", onPointerDown);
    return () => {
      strip.removeEventListener("dblclick", onDblClick);
      strip.removeEventListener("pointerdown", onPointerDown);
    };
  }, [clearStyleOnExpand, expandedMinHeight, fixedCollapsed, initialHeight, minHeight, storageKey]);

  return { panelRef };
};
