export const routeSchema = [
  `CREATE TABLE IF NOT EXISTS routes (
    locale TEXT NOT NULL,
    page_uuid TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_uuid TEXT,
    is_published INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(locale, page_uuid),
    FOREIGN KEY(page_uuid) REFERENCES documents(uuid) ON DELETE CASCADE
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS routes_locale_slug_parent_uq ON routes(locale, slug, COALESCE(parent_uuid, 'root'))",
] as const;
