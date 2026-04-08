import type { StudioProps } from "../../StudioTypes.js";

export const StudioSidebar = ({ state }: StudioProps) => {
  return (
    <aside className="studio-sidebar">
      <nav>
        <button data-active={state === "dashboard"}>Dashboard</button>
        <button data-active={state === "pages"}>Pages</button>
      </nav>
    </aside>
  );
};
