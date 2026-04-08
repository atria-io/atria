import type { StudioProps } from "../../StudioTypes.js";
import { StudioSidebar } from "./StudioSidebar.js";
import { StudioContent } from "./StudioContent.js";

export const StudioMain = ({ state }: StudioProps) => {
  return (
    <main className="admin-shell__main">
      <StudioSidebar />
      <StudioContent state={state} />
    </main>
  );
};
