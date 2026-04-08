import type { StudioProps } from "../../StudioTypes.js";
import { StudioScreen } from "../../StudioScreen.js";

export const StudioContent = ({ state }: StudioProps) => {
  return <StudioScreen state={state} />;
};
