import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  IconBell,
  IconBox,
  IconCart,
  IconChart,
  IconClose,
  IconGrid,
  IconLogout,
  IconMenu,
  IconSettings,
  IconStore,
} from "../components/icons.tsx";
import { useAuth } from "../hooks/useAuth.ts";
import { notify } from "../services/notifications.ts";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Resumen", icon: IconGrid, end: true },
  { to: "/dashboard/products", label: "Productos", icon: IconBox, end: false },
  { to: "/dashboard/sales", label: "Ventas", icon: IconCart, end: false },
  { to: "/dashboard/stats", label: "Estadísticas", icon: IconChart, end: false },
  {
    to: "/dashboard/settings",
    label: "Settings",
    icon: IconSettings,
    end: false,
  },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Resumen",
    subtitle: "Vista general del comercio y de la actividad reciente.",
  },
  "/dashboard/products": {
    title: "Productos",
    subtitle: "Catálogo, precios y estado del stock.",
  },
  "/dashboard/sales": {
    title: "Ventas",
    subtitle: "Historial de operaciones y medios de pago.",
  },
  "/dashboard/stats": {
    title: "Estadísticas",
    subtitle: "Indicadores de facturación y productos destacados.",
  },
  "/dashboard/settings": {
    title: "Settings",
    subtitle: "Datos de la cuenta y preferencias del sistema.",
  },
};

const getPageMeta = (
  pathname: string,
): { title: string; subtitle: string } => {
  if (pathname === "/dashboard/products/new") {
    return {
      title: "Nuevo producto",
      subtitle: "Alta de producto en el catálogo.",
    };
  }

  if (/^\/dashboard\/products\/\d+\/edit$/.test(pathname)) {
    return {
      title: "Editar producto",
      subtitle: "Actualizá los datos del producto.",
    };
  }

  if (/^\/dashboard\/products\/\d+$/.test(pathname)) {
    return {
      title: "Detalle del producto",
      subtitle: "Información completa, stock y precios.",
    };
  }

  return (
    PAGE_META[pathname] ?? {
      title: "Panel",
      subtitle: "Gestión comercial.",
    }
  );
};

const getInitials = (fullname: string): string =>
  fullname
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const meta = getPageMeta(location.pathname);

  const roleLabel = user?.role === "admin" ? "Administrador" : "Empleado";

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente.");
    navigate("/", { replace: true });
  };

  return (
    <div className={`app-shell${isSidebarOpen ? " app-shell--open" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar__brand brand">
          <span className="brand__mark">
            <IconStore width={20} height={20} />
          </span>
          <span>UTN TFI</span>
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Secciones del panel">
          <p className="sidebar__section-label">Panel</p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " is-active" : ""}`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <Icon width={18} height={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__footer-title">Sesión activa</p>
          <p>{user?.fullname}</p>
          <p className="sidebar__footer-role">{roleLabel}</p>
        </div>
      </aside>

      <button
        type="button"
        className="sidebar-backdrop"
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Cerrar menú"
        tabIndex={-1}
      />

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <IconMenu width={20} height={20} />
          </button>

          <div className="topbar__heading">
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>

          <div className="topbar__actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Notificaciones"
              onClick={() => notify.info("No tenés notificaciones nuevas.")}
            >
              <IconBell width={18} height={18} />
            </button>

            <div className="user-chip">
              <span className="user-chip__avatar">{getInitials(user?.fullname ?? "U")}</span>
              <span className="user-chip__info">
                <strong>{user?.fullname}</strong>
                <small>{roleLabel}</small>
              </span>
            </div>

            <button
              type="button"
              className="icon-btn icon-btn--danger"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <IconLogout width={18} height={18} />
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
