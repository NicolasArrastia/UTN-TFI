import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../components/Modal.tsx";
import { TagManager } from "../../components/tags/TagManager.tsx";
import { CreateUserForm } from "../../components/users/CreateUserForm.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { ApiError } from "../../services/api-client.ts";
import { notify } from "../../services/notifications.ts";
import {
  userService,
  type CreateUserPayload,
} from "../../services/user.service.ts";

export function SettingsPage() {
  const { user } = useAuth();
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    notify.success("Preferencias guardadas (simulación).");
  };

  const handleCreateUser = async (
    payload: CreateUserPayload,
  ): Promise<boolean> => {
    if (isCreatingUser || user?.role !== "admin") {
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

  return (
    <>
      <div className="settings-grid">
        <div className="settings-column">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Perfil de usuario</h2>
                <p className="card__subtitle">Datos de la cuenta autenticada</p>
              </div>
              <span className="badge badge--brand">
                {user?.role === "admin" ? "Administrador" : "Empleado"}
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
                  <input
                    id="email"
                    type="email"
                    defaultValue={user?.email ?? ""}
                  />
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
        </div>

        {user?.role === "admin" && (
          <div className="settings-column">
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

            <TagManager />
          </div>
        )}

        <div className="settings-column">
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
                    onChange={(event) =>
                      setLowStockAlerts(event.target.checked)
                    }
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
        </div>
      </div>

      {user?.role === "admin" && isCreateUserOpen && (
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
    </>
  );
}