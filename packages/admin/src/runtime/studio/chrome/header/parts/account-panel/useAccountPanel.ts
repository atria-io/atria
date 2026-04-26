import { useEffect, useRef, useState, type AnimationEvent, type RefObject } from "react";

type AccountPanelState = "closed" | "open" | "closing";

const CLOSE_ANIMATION_MS = 260;

export const useAccountPanel = (rootRef: RefObject<HTMLDivElement | null>) => {
  const [panelState, setPanelState] = useState<AccountPanelState>("closed");
  const closeTimerRef = useRef<number | null>(null);

  const isOpen = panelState === "open";
  const isClosing = panelState === "closing";
  const isMounted = panelState !== "closed";

  const togglePanel = (): void => {
    setPanelState((state) => (state === "open" ? "closing" : "open"));
  };

  const closePanel = (): void => {
    setPanelState((state) => (state === "open" ? "closing" : state));
  };

  const onPanelAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget || panelState !== "closing") {
      return;
    }

    setPanelState("closed");
  };

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      if (!root.contains(event.target as Node)) {
        closePanel();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMounted, rootRef]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      closePanel();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handleRouteChange = (_event: Event): void => {
      closePanel();
    };

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("atria:route-change", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("atria:route-change", handleRouteChange);
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isClosing) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      return;
    }

    closeTimerRef.current = window.setTimeout(() => {
      setPanelState("closed");
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isClosing]);

  return {
    isOpen,
    isClosing,
    isMounted,
    togglePanel,
    onPanelAnimationEnd,
  };
};
