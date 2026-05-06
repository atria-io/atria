import { getPagesWorkspaceFolders, updatePageFolderAssignment } from "./db.js";

const toStringValue = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (value: unknown): string | null => {
  const normalized = toStringValue(value);
  return normalized === "" ? null : normalized;
};

export const resolvePagesFolders = async () => {
  return getPagesWorkspaceFolders();
};

export const resolvePageFolderPatch = async (
  uuid: string,
  folderId: unknown
): Promise<boolean> => {
  return updatePageFolderAssignment(uuid, toNullableString(folderId));
};
