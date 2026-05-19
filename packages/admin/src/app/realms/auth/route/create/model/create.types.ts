export interface CreateOwnerValues {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  password: string;
}

export interface CreateOwnerModel {
  errorMessage: string | null;
  showEmailForm: boolean;
  onEnableEmailForm: () => void;
  onBackToProviderOptions: () => void;
  onSubmitCreateOwner: (values: CreateOwnerValues) => Promise<void>;
}

export interface CreateUiProps extends CreateOwnerModel {
  email: {
    submitting: boolean;
    enable: () => void;
  };
}

export interface CreateOwnerFormProps {
  disabled?: boolean;
  errorMessage?: string | null;
  onBack?: () => void;
  onSubmit: (values: CreateOwnerValues) => Promise<void> | void;
}

export interface CreateFormModelParams {
  onSubmit: (values: CreateOwnerValues) => Promise<void> | void;
}
