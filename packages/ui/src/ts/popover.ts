import * as React from "react";

type PopoverState = "closed" | "open" | "closing";

function usePopover(rootRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = React.useState<PopoverState>("closed");
  const isOpen = state === "open";
  const isClosing = state === "closing";
  const isMounted = state !== "closed";

  const toggle = (): void => {
    setState((current) => (current === "open" ? "closing" : "open"));
  };

  const close = (): void => {
    setState((current) => (current === "open" ? "closing" : current));
  };

  const onAnimationEnd: React.AnimationEventHandler<HTMLDivElement> = (
    event,
  ): void => {
    if (event.target !== event.currentTarget || state !== "closing") {
      return;
    }

    setState("closed");
  };

  React.useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      if (!root.contains(event.target as Node)) {
        close();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMounted, rootRef]);

  React.useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      close();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMounted]);

  React.useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handlePopState = (_event: PopStateEvent): void => {
      close();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isMounted]);

  return {
    isOpen,
    isClosing,
    isMounted,
    toggle,
    onAnimationEnd,
  };
}

export { usePopover };
