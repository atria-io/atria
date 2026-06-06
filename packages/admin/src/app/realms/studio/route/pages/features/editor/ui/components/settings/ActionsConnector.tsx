import * as React from "react";
import * as deps from "../../deps.js";

function ActionsConnector (
  versions: Array<deps.ActionsBodyVersion>,
  actionId: string | null,
): {
  bind: (versionId: string) => (node: HTMLDivElement | null) => void;
  has: (versionId: string) => boolean;
  view: (versionId: string, active: boolean) => React.ReactNode;
} {
  const refs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [heights, setHeights] = React.useState<Record<string, string>>({});
  const versionsKey = versions
    .map((version) => `${version.versionId}:${version.actions.map((action) => action.id).join(",")}`)
    .join("|");

  function getHeight(versionId: string): string | null {
    const block = refs.current[versionId];
    if (!block) {
      return null;
    }

    const activeRow = block.querySelector(".pages-actions__action-row--active") as HTMLLIElement | null;
    if (!activeRow) {
      return null;
    }

    const px = activeRow.offsetTop + Math.round(activeRow.offsetHeight / 2);
    return `${px - 24}px`;
  }

  function equal(a: Record<string, string>, b: Record<string, string>): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (a[key] !== b[key]) {
        return false;
      }
    }

    return true;
  }

  React.useLayoutEffect(() => {
    const read = (): Record<string, string> => {
      const next: Record<string, string> = {};

      for (const version of versions) {
        const height = getHeight(version.versionId);
        if (height) {
          next[version.versionId] = height;
        }
      }

      return next;
    };

    const first = read();
    setHeights((prev) => (equal(prev, first) ? prev : first));

    const frame = window.requestAnimationFrame(() => {
      const second = read();
      setHeights((prev) => (equal(prev, second) ? prev : second));
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [versionsKey, actionId]);

  function bind(versionId: string) {
    return (node: HTMLDivElement | null): void => {
      refs.current[versionId] = node;
    };
  }

  function has(versionId: string): boolean {
    return Boolean(heights[versionId]);
  }

  function view(versionId: string, active: boolean): React.ReactNode {
    if (!active) {
      return null;
    }

    const height = heights[versionId];
    if (!height) {
      return null;
    }

    return (
      <svg
        className="pages-actions__connector"
        aria-hidden="true"
        width="1"
        height="100%"
        viewBox="0 0 1 100"
        preserveAspectRatio="none"
        style={{ height }}
      >
        <line x1="0.5" y1="0" x2="0.5" y2="100" stroke="currentColor" />
      </svg>
    );
  }

  return { bind, has, view };
}

export { ActionsConnector };
