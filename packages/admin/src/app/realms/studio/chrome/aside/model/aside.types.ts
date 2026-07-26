import type { LucideIcon } from "lucide-react";
import type { State } from "../../../model/studio.types.js";

export type { State };

export interface SidebarItem {
  name: "Pages" | "Theme" | "Translations" | "Settings" | "Logout";
  state?: State;
  href?: string;
  onClick: () => void;
  Icon: LucideIcon;
}
