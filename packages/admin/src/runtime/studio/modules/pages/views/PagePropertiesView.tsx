import { useEffect, useState } from "react";
import type { CreatePagePayload, PageDocument, PageVersionSummary } from "../pages.types.js";

interface PagePropertiesViewProps {
  mode: "create" | "document";
  page: PageDocument | null;
  versions: PageVersionSummary[];
  loading: boolean;
  error: string | null;
  isReadOnlyVersion: boolean;
  onCreateDraft: (payload: CreatePagePayload) => Promise<void>;
  onSaveDraft: (patch: { title?: string; draftSlug?: string; template?: string }) => Promise<void>;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onDelete: () => Promise<void>;
  onOpenVersion: (versionId: string) => void;
  onAssignFolder: (folderId: string | null) => Promise<void>;
}

export const PagePropertiesView = ({
  mode,
  page,
  versions,
  loading,
  error,
  isReadOnlyVersion,
  onCreateDraft,
  onSaveDraft,
  onPublish,
  onUnpublish,
  onDelete,
  onOpenVersion,
  onAssignFolder,
}: PagePropertiesViewProps) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("page.default");
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    if (!page) {
      return;
    }
    setTitle(page.title);
    setSlug(page.draftSlug);
    setTemplate(page.template);
    setFolderId(page.folderId ?? "");
  }, [page]);

  const onCreate = async (): Promise<void> => {
    await onCreateDraft({ title, slug, template });
  };

  const onSave = async (): Promise<void> => {
    await onSaveDraft({ title, draftSlug: slug, template });
  };

  return (
    <div className="card-screen">
      <div>{mode === "create" ? "Create page" : "Properties"}</div>
      {/*{error ? <div className="pages-error">{error}</div> : null}
      <label className="pages-field">
        <span>Title</span>
        <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />
      </label>
      <label className="pages-field">
        <span>Slug</span>
        <input onChange={(event) => setSlug(event.target.value)} type="text" value={slug} />
      </label>
      <label className="pages-field">
        <span>Template</span>
        <input onChange={(event) => setTemplate(event.target.value)} type="text" value={template} />
      </label>

      {mode === "create" ? (
        <button className="pages-action" disabled={loading || slug.trim() === ""} onClick={onCreate} type="button">
          Create draft
        </button>
      ) : (
        <>
          <div className="pages-actions">
            <button className="pages-action" disabled={loading || isReadOnlyVersion} onClick={onSave} type="button">
              Save draft
            </button>
            <button className="pages-action" disabled={loading || isReadOnlyVersion} onClick={onPublish} type="button">
              Publish
            </button>
            <button className="pages-action" disabled={loading || isReadOnlyVersion} onClick={onUnpublish} type="button">
              Unpublish
            </button>
            <button className="pages-action danger" disabled={loading || isReadOnlyVersion} onClick={onDelete} type="button">
              Delete
            </button>
          </div>
          <label className="pages-field">
            <span>Folder id</span>
            <input onChange={(event) => setFolderId(event.target.value)} type="text" value={folderId} />
          </label>
          <button
            className="pages-action"
            disabled={loading || isReadOnlyVersion}
            onClick={() => onAssignFolder(folderId.trim() === "" ? null : folderId.trim())}
            type="button">
            Save folder
          </button>
          <div className="pages-versions">
            <div className="pages-panel__title">Versions</div>
            {versions.length === 0 ? <div className="pages-empty">No versions</div> : null}
            {versions.map((version) => (
              <button
                className="pages-list__item"
                key={version.versionId}
                onClick={() => onOpenVersion(version.versionId)}
                type="button">
                <span>{version.versionId}</span>
                <span className="pages-list__meta">{version.kind}</span>
              </button>
            ))}
          </div>
        </>
      )}*/}
    </div>
  );
};
