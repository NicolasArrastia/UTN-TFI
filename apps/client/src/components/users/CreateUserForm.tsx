import { useState } from "react";
import type { FormEvent } from "react";
import type { UserRole } from "../../types/auth.types.ts";
import type { CreateUserPayload } from "../../services/user.service.ts";

interface FormValues {
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

interface CreateUserFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: CreateUserPayload) => Promise<boolean>;
}

const initialValues: FormValues = {
  fullname: "",
  username: "",
  email: "",
  password: "",
  role: "employee",
};

const FORM_GRID = "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4";
const FIELD = "flex flex-col gap-[7px]";
const LABEL = "text-[13px] font-semibold text-ink-soft";
const INPUT =
  "w-full rounded-field border border-line bg-white px-[13px] py-[11px] text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13 disabled:bg-slate-50 disabled:text-muted aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-[#fff7f7]";
const SELECT = `${INPUT} cursor-pointer`;

const FORM_ACTIONS = "mt-[22px] flex flex-wrap items-center gap-3.5";
const FORM_HINT = "text-[12px] text-muted";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const SPINNER = "size-4 animate-spin rounded-full border-2 border-white/35 border-t-white";

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullname.trim()) {
    errors.fullname = "El nombre completo es obligatorio.";
  } else if (values.fullname.trim().length > 100) {
    errors.fullname = "El nombre no puede superar los 100 caracteres.";
  }

  if (!values.username.trim()) {
    errors.username = "El nombre de usuario es obligatorio.";
  } else if (values.username.trim().length > 100) {
    errors.username = "El usuario no puede superar los 100 caracteres.";
  }

  const email = values.email.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Ingresá un correo electrónico válido.";
  } else if (email.length > 150) {
    errors.email = "El correo no puede superar los 150 caracteres.";
  }

  if (values.password.length < 8 || values.password.length > 72) {
    errors.password = "La contraseña debe tener entre 8 y 72 caracteres.";
  }

  if (values.role !== "admin" && values.role !== "employee") {
    errors.role = "Seleccioná un rol válido.";
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-[12px] font-medium text-danger" id={id}>
      {message}
    </p>
  );
}

export function CreateUserForm({
  isSubmitting,
  onSubmit,
}: CreateUserFormProps) {
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
      fullname: values.fullname.trim(),
      username: values.username.trim().toLowerCase(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      role: values.role,
    });

    if (success) {
      setValues({ ...initialValues });
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={FORM_GRID}>
        <div className={`${FIELD} col-span-full`}>
          <label className={LABEL} htmlFor="new-user-fullname">
            Nombre completo *
          </label>
          <input
            className={INPUT}
            id="new-user-fullname"
            type="text"
            value={values.fullname}
            onChange={(event) => updateField("fullname", event.target.value)}
            maxLength={100}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullname)}
            aria-describedby={
              errors.fullname ? "new-user-fullname-error" : undefined
            }
          />
          <FieldError id="new-user-fullname-error" message={errors.fullname} />
        </div>

        <div className={FIELD}>
          <label className={LABEL} htmlFor="new-user-username">
            Nombre de usuario *
          </label>
          <input
            className={INPUT}
            id="new-user-username"
            type="text"
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            maxLength={100}
            autoComplete="off"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={
              errors.username ? "new-user-username-error" : undefined
            }
          />
          <FieldError id="new-user-username-error" message={errors.username} />
        </div>

        <div className={FIELD}>
          <label className={LABEL} htmlFor="new-user-email">
            Correo electrónico *
          </label>
          <input
            className={INPUT}
            id="new-user-email"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            maxLength={150}
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "new-user-email-error" : undefined}
          />
          <FieldError id="new-user-email-error" message={errors.email} />
        </div>

        <div className={FIELD}>
          <label className={LABEL} htmlFor="new-user-password">
            Contraseña *
          </label>
          <input
            className={INPUT}
            id="new-user-password"
            type="password"
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "new-user-password-error" : undefined
            }
          />
          <FieldError id="new-user-password-error" message={errors.password} />
        </div>

        <div className={FIELD}>
          <label className={LABEL} htmlFor="new-user-role">
            Rol *
          </label>
          <select
            className={SELECT}
            id="new-user-role"
            value={values.role}
            onChange={(event) =>
              updateField("role", event.target.value as UserRole)
            }
            aria-invalid={Boolean(errors.role)}
          >
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
          <FieldError id="new-user-role-error" message={errors.role} />
        </div>
      </div>

      <div className={FORM_ACTIONS}>
        <button
          type="submit"
          className={PRIMARY_BUTTON}
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className={SPINNER} /> : null}
          {isSubmitting ? "Creando usuario..." : "Crear usuario"}
        </button>
        <span className={FORM_HINT}>
          El usuario podrá iniciar sesión con las credenciales asignadas.
        </span>
      </div>
    </form>
  );
}
