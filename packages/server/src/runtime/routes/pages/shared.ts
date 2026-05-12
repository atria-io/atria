export const parseUuid = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    return null;
  }

  return normalized;
};

export const parseTitle = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized === "" || normalized.length > 200) {
    return null;
  }

  return normalized;
};

export const parseSlug = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "" ||
    normalized.length > 200 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
};

export const parseStatus = (value: unknown): "draft" | "published" | "archived" | null => {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }

  return null;
};
