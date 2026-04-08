import type { StudioState } from "./StudioTypes.js";
import { Dashboard } from "./modules/dashboard/Dashboard.js";

export interface StudioScreenProps {
  state: StudioState;
}

export const StudioScreen = ({ state }: StudioScreenProps) => {
  switch (state) {
    case "dashboard":
      return <Dashboard />;
  }
};
