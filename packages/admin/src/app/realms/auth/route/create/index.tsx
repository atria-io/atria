import { CreateUI } from "./ui/Create.js";
import { useStateEmail } from "./model/create-email.state.js";
import { useStateCreate } from "./model/create.state.js";

function Create() {
  const model = useStateCreate();
  const { isEmailSubmitting: submitting, loading } = useStateEmail(
    model.showEmailForm,
    model.onEnableEmailForm,
  );

  return (
    <CreateUI
      {...model}
      email={{
        submitting,
        enable: loading,
      }}
    />
  );
}

export { Create };
