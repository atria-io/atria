export const getTimestamp = () => new Date().toISOString();

export const toStringValue = (value) => (typeof value === "string" ? value : "");

export const toString = (value) => {
  const normalized = (typeof value === "string" ? value : "").trim();
  return normalized === "" ? null : normalized;
};

export const toCount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "bigint") {
    const converted = Number(value);
    return Number.isSafeInteger(converted) ? converted : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
