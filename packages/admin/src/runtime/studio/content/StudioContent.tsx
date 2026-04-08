import type { StudioProps } from "../StudioTypes.js";
import { StudioContent as StudioScreenContent } from "../chrome/main/StudioContent.js";

export const StudioContent = ({ state }: StudioProps) => {
  return (
    <main className="admin-shell__main">
      <StudioScreenContent state={state} />
    </main>
  );
};
