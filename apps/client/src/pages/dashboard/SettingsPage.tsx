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
    <section className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Perfil de usuario</h2>
          <p className="card__subtitle">Datos de la cuenta autenticada</p>
        </div>
        <span className="badge badge--brand">
          {isAdmin ? "Administrador" : "Empleado"}
        </span>
      </div>

      <form className="card__body" onSubmit={handleSave}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullname">Nombre completo</label>
            <input
              id="fullname"
              type="text"
              defaultValue={user?.fullname ?? ""}
            />
          </div>

          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              defaultValue={user?.username ?? ""}
              disabled
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" defaultValue={user?.email ?? ""} />
          </div>

          <div className="field">
            <label htmlFor="role">Rol</label>
            <input
              id="role"
              type="text"
              defaultValue={user?.role ?? ""}
              disabled
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary btn--sm">
            Guardar cambios
          </button>
          <span className="form-hint">
            Los cambios se persistirán al conectar PostgreSQL.
          </span>
        </div>
      </form>

      <div className="card__body">
        <div>
          <h3 className="card__title">Seguridad de la cuenta</h3>
          <p className="card__subtitle">
            Actualizá tu contraseña para proteger tu cuenta.
          </p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Cambiar contraseña
          </button>
        </div>
      </div>
    </section>
  );

  const renderPreferences = () => (
    <section className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Preferencias</h2>
          <p className="card__subtitle">Notificaciones del panel</p>
        </div>
      </div>

      <div className="card__body">
        <div className="switch-row">
          <div>
            <strong>Avisos de stock bajo</strong>
            <p className="card__subtitle">
              Mostrar alertas cuando un producto llegue al mínimo.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={lowStockAlerts}
              onChange={(event) => setLowStockAlerts(event.target.checked)}
            />
            <span />
          </label>
        </div>

        <div className="switch-row">
          <div>
            <strong>Resumen diario</strong>
            <p className="card__subtitle">
              Recibir un cierre de caja al finalizar el día.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={dailySummary}
              onChange={(event) => setDailySummary(event.target.checked)}
            />
            <span />
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
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
      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Gestión de usuarios</h2>
            <p className="card__subtitle">
              Administrá las cuentas y accesos del comercio.
            </p>
          </div>
        </div>

        <div className="card__body">
          <p className="card__subtitle">
            Creá cuentas para administradores y empleados con los permisos
            correspondientes.
          </p>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setIsCreateUserOpen(true)}
            >
              Crear usuario
            </button>
          </div>
        </div>
      </section>

      <section className="card danger-zone">
        <div>
          <h2 className="card__title">Zona sensible</h2>
          <p className="card__subtitle">
            Acciones que afectan a todas las sesiones del comercio.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() =>
            notify.info("La gestión de sesiones estará disponible pronto.")
          }
        >
          Cerrar todas las sesiones
        </button>
      </section>
    </>
  );

  return (
    <>
      <div className="settings-layout">
        <div className="settings-shell">
          <nav className="settings-nav" aria-label="Secciones de configuración">
            <p className="settings-nav__label">Configuración</p>

            {visibleSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`settings-nav__item${
                  activeSection.id === id ? " is-active" : ""
                }`}
                aria-current={activeSection.id === id ? "page" : undefined}
                onClick={() => setSelectedSection(id)}
              >
                <Icon width={16} height={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {activeSection.id === "tags" && <TagManager />}
            {activeSection.id === "categories" && <CategoryManager />}
            {activeSection.id === "admin" && isAdmin && renderAdmin()}
            {activeSection.id === "preferences" && (
              <>
                {renderProfile()}
                {renderPreferences()}
              </>
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
