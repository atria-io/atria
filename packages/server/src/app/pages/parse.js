export const uuid = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    return null;
  }
  return normalized;
};

export const title = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (normalized.length > 200) {
    return null;
  }
  return normalized;
};

export const slug = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 200 ||
    (normalized !== "" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized))) {
    return null;
  }
  return normalized;
};

export const content = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  return value;
};

export const status = (value) => {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }
  return null;
};
