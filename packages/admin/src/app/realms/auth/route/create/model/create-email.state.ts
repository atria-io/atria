import * as React from "react";

export const useStateEmail = (
  showEmailForm: boolean,
  enable: () => void
) => {
  const [isEmailSubmitting, submit] = React.useState(false);

  React.useEffect(() => {
    if (!showEmailForm) {
      submit(false);
    }
  }, [showEmailForm]);

  const loading = (): void => {
    submit(true);
    window.setTimeout(enable, 0);
  };

  return {
    isEmailSubmitting,
    loading,
  };
};
