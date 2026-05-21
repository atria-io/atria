import * as React from "react";

export const popstate = (onPopState: () => void): void => {
  const onPopStateRef = React.useRef(onPopState);
  onPopStateRef.current = onPopState;

  React.useEffect(() => {
    const handlePopState = (): void => {
      onPopStateRef.current();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
};
