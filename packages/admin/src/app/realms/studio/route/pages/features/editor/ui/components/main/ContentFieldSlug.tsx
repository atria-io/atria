import * as React from "react";
import * as Icon from "lucide-react";
import { Button, Input } from "@atria/ui";
import * as deps from "../../deps.js";

const slugFromTitle = (value: string): string => {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
};

function ContentFieldSlug() {
  const { slug, title } = deps.useState();
  const [localSlug, setLocalSlug] = React.useState(slug);
  const committedOnTabRef = React.useRef(false);
  const frontendUrl = deps.getFrontendUrl().replace(/\/+$/, "");
  const hasDuplicateSlug = false;
  const normalizedTitleSlug = slugFromTitle(title);
  const shouldShowSync =
    normalizedTitleSlug !== ""
    && localSlug.trim() !== normalizedTitleSlug;

  React.useEffect(() => {
    setLocalSlug(slug);
  }, [slug]);

  const onSyncSlug = (): void => {
    setLocalSlug(normalizedTitleSlug);
    deps.setSlug(normalizedTitleSlug);
    deps.commitEditorChanges();
  };

  const commit = (): void => {
    const nextSlug = localSlug.trim();
    setLocalSlug(nextSlug);
    deps.setSlug(nextSlug);
    deps.commitEditorChanges();
  };

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label" htmlFor="page-slug">
          Slug
        </label>

        <div
          className={`pages-editor__slug-wrap ${hasDuplicateSlug ? "pages-editor__slug-wrap--error" : ""}`}
        >
          <div className="pages-editor__slug-prefix">
            <div className="pages-editor__slug-prefix-inner">
              <span
                className="pages-editor__slug-prefix-text"
                data-tooltip={`${frontendUrl}/`}
              >
                <span>{`${frontendUrl}/`}</span>
              </span>
            </div>
          </div>

          <Input
            id="page-slug"
            type="text"
            name="slug"
            size="sm"
            full
            interactive
            value={localSlug}
            onChange={(event) => setLocalSlug(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Tab") {
                return;
              }
              committedOnTabRef.current = true;
              commit();
            }}
            onBlur={() => {
              if (committedOnTabRef.current) {
                committedOnTabRef.current = false;
                return;
              }
              commit();
            }}
            className={`pages-editor__slug-input${hasDuplicateSlug ? " input--danger" : ""}`}
            placeholder="slug"
          />
          {hasDuplicateSlug ? (
            <div
              className="icon pages-editor__slug-error"
              data-tooltip="This slug already exists."
            >
              <Icon.Info size={14} />
            </div>
          ) : null}
          {!hasDuplicateSlug && shouldShowSync ? (
            <Button
              type="button"
              variant="overlay"
              square
              icon
              className="pages-editor__slug-sync"
              data-tooltip="Sync slug with title"
              onClick={onSyncSlug}
            >
              <Icon.RefreshCw size={14} />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { ContentFieldSlug };
