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
import type { AuthUser } from "../../types/auth.types.ts";

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

interface SettingsNavProps {
  sections: SettingsSection[];
  activeSectionId: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}

function SettingsNav({
  sections,
  activeSectionId,
  onSelect,
}: SettingsNavProps) {
  return (
    <nav className="settings-nav" aria-label="Secciones de configuración">
      <p className="settings-nav__label">Configuración</p>

      {sections.map(({ id, label, icon: Icon }) => {
        const isActive = activeSectionId === id;

        return (
          <button
            key={id}
            type="button"
            className={`settings-nav__item${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(id)}
          >
            <Icon width={16} height={16} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

interface ProfileCardProps {
  user: AuthUser | null;
  isAdmin: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChangePassword: () => void;
}

function ProfileCard({
  user,
  isAdmin,
  onSubmit,
  onChangePassword,
}: ProfileCardProps) {
  return (
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

      <form className="card__body" onSubmit={onSubmit}>
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
            onClick={onChangePassword}
          >
            Cambiar contraseña
          </button>
        </div>
      </div>
    </section>
  );
}

interface SwitchRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: SwitchRowProps) {
  return (
    <div className="switch-row">
      <div>
        <strong>{label}</strong>
        <p className="card__subtitle">{description}</p>
      </div>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span />
      </label>
    </div>
  );
}

interface PreferencesCardProps {
  lowStockAlerts: boolean;
  dailySummary: boolean;
  onLowStockAlertsChange: (checked: boolean) => void;
  onDailySummaryChange: (checked: boolean) => void;
  onSave: () => void;
}

function PreferencesCard({
  lowStockAlerts,
  dailySummary,
  onLowStockAlertsChange,
  onDailySummaryChange,
  onSave,
}: PreferencesCardProps) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Preferencias</h2>
          <p className="card__subtitle">Notificaciones del panel</p>
        </div>
      </div>

      <div className="card__body">
        <SwitchRow
          label="Avisos de stock bajo"
          description="Mostrar alertas cuando un producto llegue al mínimo."
          checked={lowStockAlerts}
          onChange={onLowStockAlertsChange}
        />

        <SwitchRow
          label="Resumen diario"
          description="Recibir un cierre de caja al finalizar el día."
          checked={dailySummary}
          onChange={onDailySummaryChange}
        />

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onSave}
          >
            Guardar preferencias
          </button>
        </div>
      </div>
    </section>
  );
}

interface AdminSectionProps {
  onCreateUser: () => void;
  onCloseAllSessions: () => void;
}

function AdminSection({
  onCreateUser,
  onCloseAllSessions,
}: AdminSectionProps) {
  return (
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
              onClick={onCreateUser}
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
          onClick={onCloseAllSessions}
        >
          Cerrar todas las sesiones
        </button>
      </section>
    </>
  );
}

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

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    notify.success("Preferencias guardadas (simulación).");
  };

  const handleSavePreferences = () => {
    notify.success("Preferencias guardadas (simulación).");
  };

  const handleCloseAllSessions = () => {
    notify.info("La gestión de sesiones estará disponible pronto.");
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

  return (
    <>
      <div className="settings-layout">
        <div className="settings-shell">
          <SettingsNav
            sections={visibleSections}
            activeSectionId={activeSection.id}
            onSelect={setSelectedSection}
          />

          <div className="settings-content">
            {activeSection.id === "tags" && <TagManager />}
            {activeSection.id === "categories" && <CategoryManager />}
            {activeSection.id === "admin" && isAdmin && (
              <AdminSection
                onCreateUser={() => setIsCreateUserOpen(true)}
                onCloseAllSessions={handleCloseAllSessions}
              />
            )}
            {activeSection.id === "preferences" && (
              <>
                <ProfileCard
                  user={user}
                  isAdmin={isAdmin}
                  onSubmit={handleSaveProfile}
                  onChangePassword={() => setIsChangePasswordOpen(true)}
                />
                <PreferencesCard
                  lowStockAlerts={lowStockAlerts}
                  dailySummary={dailySummary}
                  onLowStockAlertsChange={setLowStockAlerts}
                  onDailySummaryChange={setDailySummary}
                  onSave={handleSavePreferences}
                />
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
