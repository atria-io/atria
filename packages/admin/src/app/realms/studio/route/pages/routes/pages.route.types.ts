export type PagesRouteMode = "browse" | "create" | "document";

export interface PagesRouteState {
  mode: PagesRouteMode;
  uuid: string | null;
}
