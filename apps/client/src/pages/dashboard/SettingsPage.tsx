import { useState } from "react";
import type { ComponentType, FormEvent, SVGProps } from "react";
import { Modal } from "../../components/Modal.tsx";
import { CategoryManager } from "../../components/categories/CategoryManager.tsx";
import {
  IconGrid,
  IconSettings,
  IconTag,
  IconUser,
} from "../../components/icons.tsx";
import { TagManager } from "../../components/tags/TagManager.tsx";
import { ChangePasswordForm } from "../../components/users/ChangePasswordForm.tsx";
import { CreateUserForm } from "../../components/users/CreateUserForm.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import {
  authService,
  type ChangePasswordPayload,
} from "../../services/auth.service.ts";
import { ApiError } from "../../services/api-client.ts";
import { notify } from "../../services/notifications.ts";
import {
  userService,
  type CreateUserPayload,
} from "../../services/user.service.ts";

type SettingsSectionId = "tags" | "categories" | "admin" | "preferences";

interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly: boolean;
}

const PREFERENCES_SECTION: SettingsSection = {
  id: "preferences",
  label: "Preferencias",
  icon: IconSettings,
  adminOnly: false,
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "tags", label: "Etiquetas", icon: IconTag, adminOnly: true },
  { id: "categories", label: "Categorías", icon: IconGrid, adminOnly: true },
  { id: "admin", label: "Administración", icon: IconUser, adminOnly: true },
  PREFERENCES_SECTION,
];

const CARD = "rounded-card border border-line bg-white shadow-card";
const CARD_HEADER = "flex items-start justify-between gap-4 px-[22px] pt-5";
const CARD_TITLE = "text-[15px] font-bold tracking-[-0.01em]";
const CARD_SUBTITLE = "mt-[3px] text-[12.5px] text-muted";
const CARD_BODY = "px-[22px] py-5";

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold bg-brand-soft text-brand-dark";

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4";
const FIELD = "flex flex-col gap-[7px]";
const LABEL = "text-[13px] font-semibold text-ink-soft";
const INPUT =
  "w-full rounded-field border border-line bg-white px-[13px] py-[11px] text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13 disabled:bg-slate-50 disabled:text-muted aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-[#fff7f7]";

const FORM_ACTIONS = "mt-[22px] flex flex-wrap items-center gap-3.5";
const FORM_HINT = "text-[12px] text-muted";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

const SWITCH_ROW =
  "flex items-center justify-between gap-[18px] border-b border-slate-100 py-3.5 first:pt-0";

const SWITCH_TRACK =
  "absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand peer-focus-visible:ring-[3px] peer-focus-visible:ring-brand/25 after:absolute after:left-[3px] after:top-[3px] after:size-[19px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(15,23,42,0.25)] after:transition-transform after:content-[''] peer-checked:after:translate-x-[19px]";

const NAV_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] font-medium text-muted transition-colors hover:bg-white/65 hover:text-ink-soft [&>svg]:flex-none [&>svg]:text-muted [&>svg]:opacity-85 [&>svg]:transition-colors hover:[&>svg]:text-ink-soft hover:[&>svg]:opacity-100 max-[720px]:w-auto max-[720px]:flex-none max-[720px]:whitespace-nowrap";

const NAV_ITEM_ACTIVE =
  "border-line bg-white font-semibold text-ink shadow-card [&>svg]:text-brand [&>svg]:opacity-100";

export function SettingsPage() {
  const { user } = useAuth();
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedSection, setSelectedSection] =
    useState<SettingsSectionId | null>(null);

  const isAdmin = user?.role === "admin";
  const visibleSections = SETTINGS_SECTIONS.filter(
    (section) => !section.adminOnly || isAdmin,
  );
  const activeSection =
    visibleSections.find((section) => section.id === selectedSection) ??
    PREFERENCES_SECTION;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    notify.success("Preferencias guardadas (simulación).");
  };

  const handleCreateUser = async (
    payload: CreateUserPayload,
  ): Promise<boolean> => {
    if (isCreatingUser || !isAdmin) {
      return false;
    }

    setIsCreatingUser(true);

    try {
      await userService.create(payload);
      notify.success("Usuario creado correctamente.");
      setIsCreateUserOpen(false);
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        notify.error(error.message);
      } else {
        notify.error("Ocurrió un error inesperado al crear el usuario.");
      }

      return false;
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleChangePassword = async (
    payload: ChangePasswordPayload,
  ): Promise<boolean> => {
    if (isChangingPassword || !user) {
      return false;
    }

    setIsChangingPassword(true);

    try {
      const response = await authService.changePassword(payload);
      notify.success(response.message);
      setIsChangePasswordOpen(false);
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        notify.error(error.message);
      } else {
        notify.error("Ocurrió un error inesperado al cambiar la contraseña.");
      }

      return false;
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderProfile = () => (
    <section className={CARD}>
      <div className={CARD_HEADER}>
        <div>
          <h2 className={CARD_TITLE}>Perfil de usuario</h2>
          <p className={CARD_SUBTITLE}>Datos de la cuenta autenticada</p>
        </div>
        <span className={BADGE}>
          {isAdmin ? "Administrador" : "Empleado"}
        </span>
      </div>

      <form className={CARD_BODY} onSubmit={handleSave}>
        <div className={FORM_GRID}>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="fullname">
              Nombre completo
            </label>
            <input
              className={INPUT}
              id="fullname"
              type="text"
              defaultValue={user?.fullname ?? ""}
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="username">
              Usuario
            </label>
            <input
              className={INPUT}
              id="username"
              type="text"
              defaultValue={user?.username ?? ""}
              disabled
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="email">
              Email
            </label>
            <input
              className={INPUT}
              id="email"
              type="email"
              defaultValue={user?.email ?? ""}
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="role">
              Rol
            </label>
            <input
              className={INPUT}
              id="role"
              type="text"
              defaultValue={user?.role ?? ""}
              disabled
            />
          </div>
        </div>

        <div className={FORM_ACTIONS}>
          <button type="submit" className={PRIMARY_BUTTON}>
            Guardar cambios
          </button>
          <span className={FORM_HINT}>
            Los cambios se persistirán al conectar PostgreSQL.
          </span>
        </div>
      </form>

      <div className={CARD_BODY}>
        <div>
          <h3 className={CARD_TITLE}>Seguridad de la cuenta</h3>
          <p className={CARD_SUBTITLE}>
            Actualizá tu contraseña para proteger tu cuenta.
          </p>
        </div>

        <div className={FORM_ACTIONS}>
          <button
            type="button"
            className={GHOST_BUTTON}
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Cambiar contraseña
          </button>
        </div>
      </div>
    </section>
  );

  const renderPreferences = () => (
    <section className={CARD}>
      <div className={CARD_HEADER}>
        <div>
          <h2 className={CARD_TITLE}>Preferencias</h2>
          <p className={CARD_SUBTITLE}>Notificaciones del panel</p>
        </div>
      </div>

      <div className={CARD_BODY}>
        <div className={SWITCH_ROW}>
          <div>
            <strong className="text-[13.5px]">Avisos de stock bajo</strong>
            <p className={CARD_SUBTITLE}>
              Mostrar alertas cuando un producto llegue al mínimo.
            </p>
          </div>
          <label className="relative h-[25px] w-11 flex-none cursor-pointer">
            <input
              className="peer absolute size-0 opacity-0"
              type="checkbox"
              checked={lowStockAlerts}
              onChange={(event) => setLowStockAlerts(event.target.checked)}
            />
            <span className={SWITCH_TRACK} />
          </label>
        </div>

        <div className={SWITCH_ROW}>
          <div>
            <strong className="text-[13.5px]">Resumen diario</strong>
            <p className={CARD_SUBTITLE}>
              Recibir un cierre de caja al finalizar el día.
            </p>
          </div>
          <label className="relative h-[25px] w-11 flex-none cursor-pointer">
            <input
              className="peer absolute size-0 opacity-0"
              type="checkbox"
              checked={dailySummary}
              onChange={(event) => setDailySummary(event.target.checked)}
            />
            <span className={SWITCH_TRACK} />
          </label>
        </div>

        <div className={FORM_ACTIONS}>
          <button
            type="button"
            className={GHOST_BUTTON}
            onClick={() =>
              notify.success("Preferencias guardadas (simulación).")
            }
          >
            Guardar preferencias
          </button>
        </div>
      </div>
    </section>
  );

  const renderAdmin = () => (
    <>
      <section className={CARD}>
        <div className={CARD_HEADER}>
          <div>
            <h2 className={CARD_TITLE}>Gestión de usuarios</h2>
            <p className={CARD_SUBTITLE}>
              Administrá las cuentas y accesos del comercio.
            </p>
          </div>
        </div>

        <div className={CARD_BODY}>
          <p className={CARD_SUBTITLE}>
            Creá cuentas para administradores y empleados con los permisos
            correspondientes.
          </p>

          <div className={FORM_ACTIONS}>
            <button
              type="button"
              className={PRIMARY_BUTTON}
              onClick={() => setIsCreateUserOpen(true)}
            >
              Crear usuario
            </button>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-[196px_minmax(0,1fr)] items-start gap-7 max-[720px]:grid-cols-1 max-[720px]:gap-4">
          <nav
            className="sticky top-[88px] flex min-w-0 flex-col gap-0.5 max-[720px]:static max-[720px]:flex-row max-[720px]:gap-1.5 max-[720px]:overflow-x-auto max-[720px]:pb-1"
            aria-label="Secciones de configuración"
          >
            <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted opacity-75 max-[720px]:hidden">
              Configuración
            </p>

            {visibleSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`${NAV_ITEM}${
                  activeSection.id === id
                    ? ` ${NAV_ITEM_ACTIVE}`
                    : " border-transparent"
                }`}
                aria-current={activeSection.id === id ? "page" : undefined}
                onClick={() => setSelectedSection(id)}
              >
                <Icon width={16} height={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-col gap-5">
            {activeSection.id === "tags" && <TagManager />}
            {activeSection.id === "categories" && <CategoryManager />}
            {activeSection.id === "admin" && isAdmin && renderAdmin()}
            {activeSection.id === "preferences" && (
              <div className="flex w-full flex-col items-start gap-5 [&>*]:w-full">
                {renderProfile()}
                {renderPreferences()}
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && isCreateUserOpen && (
        <Modal
          title="Nuevo usuario"
          description="Completá los datos para registrar una nueva cuenta."
          isBusy={isCreatingUser}
          onClose={() => setIsCreateUserOpen(false)}
        >
          <CreateUserForm
            isSubmitting={isCreatingUser}
            onSubmit={handleCreateUser}
          />
        </Modal>
      )}

      {user && isChangePasswordOpen && (
        <Modal
          title="Cambiar contraseña"
          description="Ingresá tu contraseña actual y elegí una nueva."
          isBusy={isChangingPassword}
          onClose={() => setIsChangePasswordOpen(false)}
        >
          <ChangePasswordForm
            isSubmitting={isChangingPassword}
            onSubmit={handleChangePassword}
          />
        </Modal>
      )}
    </>
  );
}
