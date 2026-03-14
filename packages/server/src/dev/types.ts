export type SiteTarget = "public" | "admin";

export type ResolveRequestMode = "strict" | "spa-fallback";

export type ResolveRequestResult =
  | { type: "file"; filePath: string }
  | { type: "not-found" }
  | { type: "forbidden" };
