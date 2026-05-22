import * as React from "react";
import * as Icon from "lucide-react";
import * as deps from "../../deps.js";
import { Button } from "@atria/ui";

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
  const { archivedOnly } = deps.useFilter();

  const focusTitleField = React.useCallback((): void => {
    window.requestAnimationFrame(() => {
      const titleInput = document.getElementById("page-title");
      if (!(titleInput instanceof HTMLInputElement)) {
        return;
      }

      titleInput.focus();
    });
  }, []);

  const onCreatePage = (): void => {
    deps.setArchived(false);
    deps.startCreate();
    const nextPath = deps.createPath(window.location.pathname);
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
    focusTitleField();
  };

  const onToggleArchived = (): void => {
    deps.setArchived();
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
      onClick: onToggleArchived,
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
