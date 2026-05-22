import * as React from "react";
import * as Icon from "lucide-react";
import { Button } from "@atria/ui";
import { resolveCreatePath } from "../../../../../routes/pages.routes.js";
import { startCreate } from "../../../../editor/model/editor.state.js";
import { closeArchivedOnly, toggleArchivedOnly, useCatalogFilterState } from "../../../model/catalog.state.js";

interface ActionButtonProps {
  actionClassName: string;
  ariaLabel: string;
  tooltip: string;
  Icon: Icon.LucideIcon;
  iconSize: number;
  active?: boolean;
  onClick?: () => void;
}

interface ActionConfig extends ActionButtonProps {
  key: string;
}

function ActionButton({
  actionClassName,
  ariaLabel,
  tooltip,
  Icon,
  iconSize,
  active = false,
  onClick,
}: ActionButtonProps) {
  const rootRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    if (active) {
      root.setAttribute("active", "");
      return;
    }

    root.removeAttribute("active");
  }, [active]);

  return (
    <Button
      ref={rootRef}
      type="button"
      variant="overlay"
      square
      icon
      className={actionClassName}
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      onClick={onClick}
    >
      <Icon size={iconSize} />
    </Button>
  );
}

function Actions() {
  const { archivedOnly } = useCatalogFilterState();

  const onCreatePage = (): void => {
    closeArchivedOnly();
    startCreate();
    const nextPath = resolveCreatePath(window.location.pathname);
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const props: ActionConfig[] = [
    {
      key: "filter",
      actionClassName: "pages-catalog__action--filter",
      ariaLabel: "Filter",
      tooltip: "Filter",
      Icon: Icon.ListFilter,
      iconSize: 13,
    },
    {
      key: "archived",
      actionClassName: "pages-catalog__action--archived",
      ariaLabel: archivedOnly ? "Close" : "Archived",
      tooltip: archivedOnly ? "Close" : "Archived",
      Icon: archivedOnly ? Icon.X : Icon.Archive,
      iconSize: archivedOnly ? 15 : 13,
      active: archivedOnly,
      onClick: toggleArchivedOnly,
    },
    {
      key: "create",
      actionClassName: "pages-catalog__action--create",
      ariaLabel: "Add Page",
      tooltip: "Add Page",
      Icon: Icon.Plus,
      iconSize: 16,
      onClick: onCreatePage,
    },
  ];

  return (
    <>
      <div>Catalog</div>
      <div className="pages-catalog__header-action">
        {props.map(({ key, ...props }) => (
          <ActionButton key={key} {...props} />
        ))}
      </div>
    </>
  );
}

export { Actions };
