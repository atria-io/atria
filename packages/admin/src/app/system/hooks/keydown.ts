import * as React from "react";

export interface ShortcutOptions {
  key: string;
  metaOrCtrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  enabled?: boolean;
  preventDefault?: boolean;
}

const isMacOs = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
    };
  };
  const platform = nav.userAgentData?.platform || navigator.platform || "";
  return /mac/i.test(platform);
};

const toDisplayKey = (value: string): string => {
  if (value.length === 1) {
    return value.toUpperCase();
  }

  return value;
};

export const formatKeydownLabel = (options: ShortcutOptions): string => {
  const macOs = isMacOs();
  const keys: string[] = [];

  if (options.metaOrCtrl) {
    keys.push("Ctrl");
  }

  if (options.shift) {
    keys.push(macOs ? "⇧" : "Shift");
  }

  if (options.alt) {
    keys.push(macOs ? "⌥" : "Alt");
  }

  keys.push(toDisplayKey(options.key));

  const label = keys.join("+");
  return macOs && options.metaOrCtrl ? `⌘ ${label.replace(/^Ctrl/, "Cmd")}` : label;
};

const matchesModifier = (eventValue: boolean, expected?: boolean): boolean => {
  if (expected === undefined) {
    return true;
  }

  return eventValue === expected;
};

export const keydown = (
  options: ShortcutOptions,
  onTrigger: () => void,
): void => {
  const onTriggerRef = React.useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const {
    key,
    metaOrCtrl = false,
    shift,
    alt,
    enabled = true,
    preventDefault = false,
  } = options;

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const expectedKey = key.toLowerCase();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== expectedKey) {
        return;
      }

      if (metaOrCtrl && !(event.metaKey || event.ctrlKey)) {
        return;
      }

      if (!matchesModifier(event.shiftKey, shift) || !matchesModifier(event.altKey, alt)) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }

      onTriggerRef.current();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [alt, enabled, key, metaOrCtrl, preventDefault, shift]);
};
