import type { StudioProps } from "./StudioTypes.js";
import { Dashboard } from "./modules/dashboard/Dashboard.js";

export const StudioScreen = ({ state }: StudioProps) => {
  switch (state) {
    case "dashboard":
      return <Dashboard />;
  }
};
