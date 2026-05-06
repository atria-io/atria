export type PageRecord = Record<string, unknown>;

export type WorkspaceRecord = {
  dataJson?: unknown;
};

export type VersionSnapshot = {
  snapshotJson?: unknown;
};

export type RouteLookup = {
  slug?: unknown;
  parentUuid?: unknown;
  isPublished?: unknown;
};

export type PageListRoute = {
  slug?: unknown;
  isPublished?: unknown;
};
