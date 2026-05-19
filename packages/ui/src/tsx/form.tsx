import * as React from "react";

type FormSection = "fields" | "actions" | "feedback";

export type FormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  children: React.ReactNode;
  scope?: string;
};

export type FormSectionProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  section: FormSection;
  scope?: string;
};

function Form({
  className = "",
  children,
  scope = "form",
  ...props
}: FormProps) {
  const formClass = [`${scope}-form`, className].filter(Boolean).join(" ");
  return (
    <form className={formClass} {...props}>
      {children}
    </form>
  );
}

function FormSection({
  className = "",
  children,
  section,
  scope = "form",
  ...props
}: FormSectionProps) {
  const sectionClass = [`${scope}-form__${section}`, className].filter(Boolean).join(" ");

  return (
    <div className={sectionClass} {...props}>
      {children}
    </div>
  );
}

export { Form, FormSection };
