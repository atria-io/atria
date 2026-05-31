export interface CatalogItem {
  uuid: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published" | "archived";
}

export interface PageHistoryAction {
  id: string;
  type: string;
  createdAt?: string;
  optimistic?: boolean;
  optimisticAt?: number;
}

export interface PageHistoryVersion {
  versionId: string;
  actions: Array<PageHistoryAction>;
  live: boolean;
}

export interface PageHistoryPayload {
  versions?: Array<PageHistoryVersion>;
}

export interface EditorState {
  creating: boolean;
  switching: boolean;
  editorMode: boolean;
  versionId: string | null;
  canonicalStatus: "draft" | "published" | "archived" | null;
  hasEditorChanges: boolean;
  title: string;
  slug: string;
  content: string;
  currentUuid: string | null;
  drafts: CatalogItem[];
  sync: Record<string, { status: "idle" | "syncing" | "error"; error: string | null }>;
  historyByPage: Record<string, {
    versions: Array<PageHistoryVersion>;
  }>;
}

export interface PageApiPayload {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published" | "archived";
  editorMode?: boolean;
  versionId?: string;
  canonicalStatus?: "draft" | "published" | "archived";
}

export interface ActionsBranchProps {
  canonicalStatus: "draft" | "published" | "archived" | null;
  editorMode: boolean;
  fallbackState: "LIVE" | "DRAFT";
  hasHistory: boolean;
  isCurrent: boolean;
  versionId: string;
  live: boolean;
}

export interface ActionsItemProps {
  action: PageHistoryAction;
  pick: (versionId: string, actionId: string) => void;
  version: ActionsBodyVersion;
}

export interface ActionsBodyVersion {
  versionId: string;
  live: boolean;
  isCurrent: boolean;
  branchState: "LIVE" | "DRAFT";
  actions: Array<PageHistoryAction>;
}

export interface ActionsBranchViewProps {
  version: ActionsBodyVersion;
}

export interface ActionsListProps {
  actionId: string | null;
  pick: (versionId: string, actionId: string) => void;
  version: ActionsBodyVersion;
}
