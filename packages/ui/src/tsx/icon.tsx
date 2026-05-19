import * as React from "react";

function Icon({
  className = "",
  ...props
}: React.ComponentProps<"span">) {
  const iconClass = ["icon", className].filter(Boolean).join(" ");

  return (
    <span className={iconClass} {...props} />
  );
}

export { Icon };
