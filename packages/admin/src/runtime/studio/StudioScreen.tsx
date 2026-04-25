import type { StudioProps } from "./StudioTypes.js";
import { DashboardView } from "./modules/dashboard/DashboardView.js";
import { PagesView } from "./modules/pages/PagesView.js";
import { SettingsView } from "./modules/settings/SettingsView.js";

export const StudioScreen = ({ state }: StudioProps) => {
  switch (state) {
    case "dashboard":
      return <DashboardView />;

    case "pages":
      return <PagesView />;

    case "settings":
      return <SettingsView />;
  }
};
