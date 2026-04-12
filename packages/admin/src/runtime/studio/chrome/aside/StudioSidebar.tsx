import type { StudioProps } from "../../StudioTypes.js";
import { Layers2 } from "lucide-react";

export const StudioSidebar = ({ state }: StudioProps) => {
  const navigateToPages = (): void => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <aside className="admin-shell__sidebar">
      <nav>
        <button aria-label="Pages" data-tooltip="Pages" data-active={state === "pages"} onClick={navigateToPages} type="button">
          <Layers2 className="admin-shell__sidebar-icon" />
        </button>
      </nav>
    </aside>
  );
};
