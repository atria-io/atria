import * as React from "react";
import * as deps from "../../deps.js";
import { ActionsItem } from "./ActionsItem.js";

function ActionsList({ actionId, pick, version }: deps.ActionsListProps) {
  const activeId = actionId ?? (version.isCurrent ? version.actions[0]?.id ?? null : null);
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      {version.actions.map((action) => (
        <li
          key={action.id}
          className={activeId === action.id ? "pages-actions__action-row pages-actions__action-row--active" : "pages-actions__action-row"}
        >
          {activeId === action.id ? (
            <div className="pages-actions__active">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path d="M16,15.5C7.44,15.5.5,8.56.5,0"/>
              </svg>
            </div>
          ) : null}
          <ActionsItem
            action={action}
            pick={pick}
            version={version}
          />
        </li>
      ))}
    </>
  );
}

export { ActionsList };
