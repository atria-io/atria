import type { StudioProps } from "../StudioTypes.js";
import { StudioScreen } from "../StudioScreen.js";

export const StudioContent = ({ state }: StudioProps) => {
  return (
    <main className="admin-shell__main">
      <StudioScreen state={state} />
    </main>
  );
};
