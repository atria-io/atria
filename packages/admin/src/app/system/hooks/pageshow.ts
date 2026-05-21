import * as React from "react";

function pageshow(onReset: () => void) {
  const onResetRef = React.useRef(onReset);
  onResetRef.current = onReset;

  React.useEffect(() => {
    const handlePageShow = () => {
      onResetRef.current();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);
}

export { pageshow };
