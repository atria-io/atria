import * as React from "react";

export type TextareaProps = React.ComponentProps<"textarea"> & {
  full?: boolean;
  interactive?: boolean;
};

const getTextareaClass = ({
  full,
  interactive,
  className,
}: {
  full: boolean;
  interactive: boolean;
  className: string;
}): string =>
  [
    "textarea",
    full ? "textarea--full" : "",
    interactive ? "textarea--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

function Textarea({
  className = "",
  full = false,
  interactive = false,
  ...props
}: TextareaProps) {
  const textareaClass = getTextareaClass({
    full,
    interactive,
    className,
  });

  return <textarea className={textareaClass} {...props} />;
}

export { Textarea };
