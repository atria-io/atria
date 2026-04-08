import type { StudioProps } from "../StudioTypes.js";
import { Dashboard } from "../modules/dashboard/Dashboard.js";
import { Pages } from "../modules/pages/Pages.js";

export const StudioContent = ({ state }: StudioProps) => {
  switch (state) {
    case "dashboard":
      return <Dashboard />;

    case "pages":
      return <Pages />;

    default:
      return null;
  }
};
