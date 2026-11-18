import { ActionTile } from "../../components/ActionTile.tsx";
import {
  IconBox,
  IconCart,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconWarning,
} from "../../components/icons.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { notify } from "../../services/notifications.ts";

export function EmployeeHomePage() {
  const { user } = useAuth();
  const firstName = user?.fullname.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.01em]">
          Hola, {firstName}
        </h2>
        <p className="text-[13px] text-muted">¿Qué querés hacer hoy?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionTile
          icon={IconPlus}
          title="Registrar venta"
          description="Cargá una nueva operación"
          tone="brand"
          highlighted
          to="/dashboard/sales/new"
        />
        <ActionTile
          icon={IconBox}
          title="Consultar stock"
          description="Buscá productos y disponibilidad"
          tone="neutral"
          to="/dashboard/products"
        />
        <ActionTile
          icon={IconCart}
          title="Mis ventas"
          description="Tu historial de operaciones"
          tone="neutral"
          to="/dashboard/sales"
        />
        <ActionTile
          icon={IconRefresh}
          title="Solicitar anulación"
          description="Pedile al administrador que anule una venta"
          tone="danger"
          comingSoon
          onClick={() =>
            notify.info(
              "La solicitud de anulación estará disponible próximamente.",
            )
          }
        />
        <ActionTile
          icon={IconWarning}
          title="Avisar stock bajo"
          description="Reportá un producto con faltante"
          tone="warning"
          comingSoon
          onClick={() =>
            notify.info(
              "El aviso de stock bajo estará disponible próximamente.",
            )
          }
        />
        <ActionTile
          icon={IconSettings}
          title="Settings"
          description="Tu perfil y contraseña"
          tone="neutral"
          to="/dashboard/settings"
        />
      </div>
    </>
  );
}
