import type { Props } from "./types.js";
import { DashboardView } from "./screen/domains/dashboard/DashboardView.js";
import { PagesView } from "./screen/domains/pages/PagesView.js";
import { SettingsView } from "./screen/domains/settings/SettingsView.js";

export const Screen = ({ state }: Props) => {
  switch (state) {
    case "dashboard":
      return <DashboardView />;

    case "pages":
      return <PagesView />;

    case "settings":
      return <SettingsView />;
  }
};
