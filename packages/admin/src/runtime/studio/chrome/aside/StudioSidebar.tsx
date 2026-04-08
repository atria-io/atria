import type { StudioProps } from "../../StudioTypes.js";

export const StudioSidebar = ({ state }: StudioProps) => {
  return (
    <aside className="admin-shell__sidebar">
      <nav>
        <button data-active={state === "dashboard"}></button>
        <button data-active={state === "pages"}></button>
      </nav>
    </aside>
  );
};
