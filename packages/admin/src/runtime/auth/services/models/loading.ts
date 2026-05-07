import { useEffect, useState } from "react";

export const toLoadingButtonClass = (
  baseClassName: string,
  isLoading: boolean
): string => {
  return isLoading ? `${baseClassName} loading` : baseClassName;
};

export const useEmailFormLoading = (
  showEmailForm: boolean,
  onEnableEmailForm: () => void
) => {
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  useEffect(() => {
    if (!showEmailForm) {
      setIsEmailSubmitting(false);
    }
  }, [showEmailForm]);

  const onEnableEmailFormWithLoading = (): void => {
    setIsEmailSubmitting(true);
    window.setTimeout(onEnableEmailForm, 0);
  };

  return {
    isEmailSubmitting,
    onEnableEmailFormWithLoading
  };
};
