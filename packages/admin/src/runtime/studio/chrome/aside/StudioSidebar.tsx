import { File } from "lucide-react";
import type { StudioProps } from "../../StudioTypes.js";

export const StudioSidebar = ({ state }: StudioProps) => {
  const navigateToPages = (): void => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <aside className="admin-shell__sidebar">
      <nav>
        {/* <button data-active={state === "dashboard"}></button> */}
        <button aria-label="Pages" data-active={state === "pages"} onClick={navigateToPages} type="button">
          <File className="admin-shell__sidebar-icon" />
        </button>
      </nav>
    </aside>
  );
};
