export interface SignInValues {
  email: string;
  password: string;
}

export interface SignInModel {
  errorMessage: string | null;
  showEmailForm: boolean;
  onEnableEmailForm: () => void;
  onBackToProviderOptions: () => void;
  onSubmitSignIn: (values: SignInValues) => Promise<void>;
}

export interface SignInFormProps {
  disabled?: boolean;
  errorMessage?: string | null;
  onBack?: () => void;
  onSubmit: (values: SignInValues) => Promise<void> | void;
}
