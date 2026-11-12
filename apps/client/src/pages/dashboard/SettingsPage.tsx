import { useState } from "react";
import type { FormEvent } from "react";
import { TagManager } from "../../components/tags/TagManager.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { notify } from "../../services/notifications.ts";

export function SettingsPage() {
  const { user } = useAuth();
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    notify.success("Preferencias guardadas (simulación).");
  };

  return (
    <div className="settings-grid">
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
      </section>

      {user?.role === "admin" ? <TagManager /> : null}

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
              onClick={() => notify.success("Preferencias guardadas (simulación).")}
            >
              Guardar preferencias
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
    </div>
  );
}
