import { useState } from "react";
import type { FormEvent } from "react";
import type { ChangePasswordPayload } from "../../services/auth.service.ts";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

interface ChangePasswordFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: ChangePasswordPayload) => Promise<boolean>;
}

const initialValues: FormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Ingresá tu contraseña actual.";
  }

  if (!values.newPassword) {
    errors.newPassword = "Ingresá una contraseña nueva.";
  } else if (
    values.newPassword.length < 8 ||
    new TextEncoder().encode(values.newPassword).length > 72
  ) {
    errors.newPassword =
      "La contraseña debe tener al menos 8 caracteres y no superar los 72 bytes.";
  } else if (values.currentPassword === values.newPassword) {
    errors.newPassword = "La nueva contraseña debe ser diferente de la actual.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirmá la nueva contraseña.";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="field__error" id={id}>
      {message}
    </p>
  );
}

export function ChangePasswordForm({
  isSubmitting,
  onSubmit,
}: ChangePasswordFormProps) {
  const [values, setValues] = useState<FormValues>({ ...initialValues });
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const success = await onSubmit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });

    if (success) {
      setValues({ ...initialValues });
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field field--full">
          <label htmlFor="change-current-password">Contraseña actual *</label>
          <input
            id="change-current-password"
            type="password"
            value={values.currentPassword}
            onChange={(event) =>
              updateField("currentPassword", event.target.value)
            }
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={
              errors.currentPassword
                ? "change-current-password-error"
                : undefined
            }
          />
          <FieldError
            id="change-current-password-error"
            message={errors.currentPassword}
          />
        </div>

        <div className="field field--full">
          <label htmlFor="change-new-password">Nueva contraseña *</label>
          <input
            id="change-new-password"
            type="password"
            value={values.newPassword}
            onChange={(event) => updateField("newPassword", event.target.value)}
            autoComplete="new-password"
            minLength={8}
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={
              errors.newPassword ? "change-new-password-error" : undefined
            }
          />
          <FieldError
            id="change-new-password-error"
            message={errors.newPassword}
          />
        </div>

        <div className="field field--full">
          <label htmlFor="change-confirm-password">
            Confirmar nueva contraseña *
          </label>
          <input
            id="change-confirm-password"
            type="password"
            value={values.confirmPassword}
            onChange={(event) =>
              updateField("confirmPassword", event.target.value)
            }
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword
                ? "change-confirm-password-error"
                : undefined
            }
          />
          <FieldError
            id="change-confirm-password-error"
            message={errors.confirmPassword}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className="spinner" /> : null}
          {isSubmitting ? "Actualizando..." : "Cambiar contraseña"}
        </button>
        <span className="form-hint">
          La nueva contraseña debe tener al menos 8 caracteres.
        </span>
      </div>
    </form>
  );
}
