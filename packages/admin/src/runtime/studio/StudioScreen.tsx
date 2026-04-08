import type { StudioProps } from "./StudioTypes.js";
import { Dashboard } from "./modules/dashboard/Dashboard.js";
import { Pages } from "./modules/pages/Pages.js";

export const StudioScreen = ({ state }: StudioProps) => {
  switch (state) {
    case "dashboard":
      return <Dashboard />;

    case "pages":
      return <Pages />;
  }
};
