import type { StudioProps } from "./StudioTypes.js";
import { DashboardView } from "./modules/dashboard/DashboardView.js";
import { PagesView } from "./modules/pages/PagesView.js";

export const StudioScreen = ({ state }: StudioProps) => {
  switch (state) {
    case "dashboard":
      return <DashboardView />;

    case "pages":
      return <PagesView />;
  }
};
