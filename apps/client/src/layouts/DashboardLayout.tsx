import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  {
    to: "/dashboard/stats",
    label: "Estadísticas",
    icon: IconChart,
    end: false,
  },
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

const getPageMeta = (pathname: string): { title: string; subtitle: string } => {
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

const ICON_BUTTON =
  "inline-flex size-[38px] items-center justify-center rounded-field border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const NAV_LINK =
  "flex items-center gap-3 rounded-field px-3 py-[11px] text-sm font-medium text-slate-400 transition-colors hover:bg-slate-400/10 hover:text-slate-200";

const NAV_LINK_ACTIVE =
  "bg-gradient-to-r from-brand/30 to-brand/10 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.22)]";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const meta = getPageMeta(location.pathname);

  const roleLabel = user?.role === "admin" ? "Administrador" : "Empleado";

  const handleLogout = () => {
    logout();
    notify.success("Sesión cerrada correctamente.");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex h-screen w-[264px] flex-[0_0_264px] flex-col bg-sidebar px-4 py-[22px] text-slate-300 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          isSidebarOpen
            ? "translate-x-0 shadow-[20px_0_45px_-30px_rgba(15,23,42,0.6)]"
            : "-translate-x-full"
        }`}
      >
        <div className="relative mb-1.5 flex items-center gap-3 px-2 pb-6 text-[17px] font-bold tracking-[-0.01em] text-slate-50">
          <span className="inline-flex size-[38px] items-center justify-center rounded-[11px] border border-indigo-300/35 bg-indigo-500/22 text-indigo-200">
            <IconStore width={20} height={20} />
          </span>
          <span>UTN TFI</span>
          <button
            type="button"
            className="ml-auto inline-flex items-center justify-center text-slate-400 transition-colors hover:text-slate-100 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <nav className="grid gap-1" aria-label="Secciones del panel">
          <p className="mx-3 mb-2 mt-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Panel
          </p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${NAV_LINK}${isActive ? ` ${NAV_LINK_ACTIVE}` : ""}`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <Icon width={18} height={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-400/15 px-3 pb-1 pt-4 text-[13px] text-slate-200">
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Sesión activa
          </p>
          <p className="font-semibold">{user?.fullname}</p>
          <p className="mt-0.5 text-xs text-indigo-400">{roleLabel}</p>
        </div>
      </aside>

      <button
        type="button"
        className={`fixed inset-0 z-50 bg-ink/45 lg:hidden ${
          isSidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Cerrar menú"
        tabIndex={-1}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/92 px-4 py-3 backdrop-blur md:gap-4 md:px-7 md:py-3.5">
          <button
            type="button"
            className={`${ICON_BUTTON} lg:hidden`}
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <IconMenu width={20} height={20} />
          </button>

          <div>
            <h1 className="text-[19px] font-bold tracking-[-0.01em]">{meta.title}</h1>
            <p className="mt-0.5 hidden text-[12.5px] text-muted md:block">
              {meta.subtitle}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label="Notificaciones"
              onClick={() => notify.info("No tenés notificaciones nuevas.")}
            >
              <IconBell width={18} height={18} />
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pl-1 pr-3 max-md:p-1">
              <span className="grid size-[30px] place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-900 text-[11.5px] font-bold text-white">
                {getInitials(user?.fullname ?? "U")}
              </span>
              <span className="hidden flex-col leading-[1.25] md:flex">
                <strong className="text-[12.5px] font-semibold">{user?.fullname}</strong>
                <small className="text-[11px] text-muted">{roleLabel}</small>
              </span>
            </div>

            <button
              type="button"
              className={`${ICON_BUTTON} hover:border-red-200 hover:bg-danger-soft hover:text-red-700`}
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <IconLogout width={18} height={18} />
            </button>
          </div>
        </header>

        <main className="grid content-start gap-[22px] p-[18px] px-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
