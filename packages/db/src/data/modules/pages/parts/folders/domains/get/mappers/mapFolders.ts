import type { WorkspaceFolders } from "@/data/modules/pages/types.js";
import * as support from "@/data/support/shared.js";

export const mapFolders = (
  dataJson: Record<string, unknown>
): WorkspaceFolders => {
  const foldersRaw = dataJson.folders as Record<string, unknown>;
  const assignmentsRaw = dataJson.assignments as Record<string, unknown>;

  const folders = Object.entries(foldersRaw).map(([id, value]) => {
    const node = value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
    return {
      id,
      name: support.toString(node.name) ?? id,
      parent: support.toStringOrNull(node.parent),
    };
  });

  const assignments: Record<string, string> = {};
  for (const [documentUuid, folderIdRaw] of Object.entries(assignmentsRaw)) {
    const folderId = support.toString(folderIdRaw);
    if (folderId) {
      assignments[documentUuid] = folderId;
    }
  }

  return { folders, assignments };
};
