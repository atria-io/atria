import * as React from "react";
import * as Icon from "lucide-react";
import * as deps from "../deps.js";
import { Button } from "@atria/ui";

function Header() {
  const { archivedOnly } = deps.use();
  const archivedButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const button = archivedButtonRef.current;
    if (!button) {
      return;
    }
    if (archivedOnly) {
      button.setAttribute("active", "");
      return;
    }
    button.removeAttribute("active");
  }, [archivedOnly]);

  const onCreatePage = (): void => {
    deps.setArchived(false);
    deps.startCreate();
    const nextPath = deps.createPath(window.location.pathname);
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.requestAnimationFrame(() => {
      const titleInput = document.getElementById("page-title");
      if (titleInput instanceof HTMLInputElement) {
        titleInput.focus();
      }
    });
  };

  const onToggleArchived = (): void => {
    deps.setArchived();
  };

  const props: Array<{
    key: string;
    actionClassName: string;
    ariaLabel: string;
    tooltip: string;
    icon: Icon.LucideIcon;
    iconSize: number;
    onClick?: () => void;
  }> = [
    {
      key: "filter",
      actionClassName: "pages-catalog__action--filter",
      ariaLabel: "Filter",
      tooltip: "Filter",
      icon: Icon.ListFilter,
      iconSize: 13,
    },
    {
      key: "archived",
      actionClassName: "pages-catalog__action--archived",
      ariaLabel: archivedOnly ? "Close" : "Archived",
      tooltip: archivedOnly ? "Close" : "Archived",
      icon: archivedOnly ? Icon.X : Icon.Archive,
      iconSize: archivedOnly ? 15 : 13,
      onClick: onToggleArchived,
    },
    {
      key: "create",
      actionClassName: "pages-catalog__action--create",
      ariaLabel: "Add Page",
      tooltip: "Add Page",
      icon: Icon.Plus,
      iconSize: 16,
      onClick: onCreatePage,
    },
  ];

  return (
    <>
      <span>Catalog</span>
      {archivedOnly ? (
        <span className="pages-catalog__header-subtitle">
          <span aria-hidden="true"> • </span>
          <span>Archived</span>
        </span>
      ) : null}
      <div className="pages-catalog__header-action">
        {props.map(({ key, icon: IconComp, ...item }) => (
          <Button
            key={key}
            ref={key === "archived" ? archivedButtonRef : undefined}
            type="button"
            variant="overlay"
            square
            icon
            className={item.actionClassName}
            aria-label={item.ariaLabel}
            data-tooltip={item.tooltip}
            onClick={item.onClick}
          >
            <IconComp size={item.iconSize} />
          </Button>
        ))}
      </div>
    </>
  );
}

export { Header };
