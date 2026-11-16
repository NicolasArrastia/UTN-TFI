import { Link, useLocation } from "react-router-dom";
import { IconEdit, IconTrash } from "../icons.tsx";
import { formatCurrency } from "../../utils/format.ts";
import type { Product } from "../../types/product.types.ts";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  canManage: boolean;
  onDelete: (product: Product) => void;
}

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";

const BADGE_TONES = {
  success: "bg-success-soft text-green-700",
  warning: "bg-warning-soft text-amber-700",
  danger: "bg-danger-soft text-red-700",
  neutral: "bg-slate-100 text-slate-600",
};

type BadgeTone = keyof typeof BADGE_TONES;

const ICON_BUTTON =
  "inline-flex size-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getStockTone = (product: Product): BadgeTone => {
  if (product.stock === 0) return "danger";
  if (product.lowStock) return "warning";
  return "success";
};

export function ProductTable({
  products,
  isLoading,
  canManage,
  onDelete,
}: ProductTableProps) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {["Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"].map(
              (heading) => (
                <th
                  key={heading}
                  className="whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50">
          {isLoading ? (
            <tr>
              <td colSpan={6}>
                <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                  <span
                    className="size-8 animate-spin rounded-full border-[3px] border-line border-t-brand"
                    aria-hidden="true"
                  />
                  <span>Cargando productos...</span>
                </div>
              </td>
            </tr>
          ) : null}

          {!isLoading && products.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                  No encontramos productos con los filtros seleccionados.
                </div>
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? products.map((product) => (
                <tr key={product.id}>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4">
                    <Link
                      className="group flex items-center gap-2.5 text-inherit"
                      to={`/dashboard/products/${product.id}`}
                      state={{ from }}
                    >
                      <span className="grid size-[34px] place-items-center rounded-[9px] bg-brand-soft text-[11.5px] font-bold text-brand-dark">
                        {getInitials(product.name)}
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-semibold text-ink group-hover:text-brand">
                          {product.name}
                        </span>
                        {product.description ? (
                          <span className="max-w-[280px] overflow-hidden text-ellipsis text-[12.5px] text-muted max-md:max-w-[180px]">
                            {product.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4">
                    <span className={`${BADGE} ${BADGE_TONES.neutral}`}>
                      {product.category?.name ?? "Sin categoría"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle font-semibold text-ink max-md:px-4">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4">
                    <span
                      className={`${BADGE} ${BADGE_TONES[getStockTone(product)]}`}
                      title={`Stock mínimo: ${product.minStock} unidades`}
                    >
                      {product.stock} u.
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4">
                    <span
                      className={`${BADGE} ${
                        product.isActive ? BADGE_TONES.success : BADGE_TONES.neutral
                      }`}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/dashboard/products/${product.id}`}
                        state={{ from }}
                        className="inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        Ver
                      </Link>

                      {canManage ? (
                        <>
                          <Link
                            to={`/dashboard/products/${product.id}/edit`}
                            state={{ from }}
                            className={ICON_BUTTON}
                            title="Editar producto"
                            aria-label={`Editar ${product.name}`}
                          >
                            <IconEdit width={16} height={16} />
                          </Link>
                          {product.isActive ? (
                            <button
                              type="button"
                              className={`${ICON_BUTTON} hover:border-red-200 hover:bg-danger-soft hover:text-red-700`}
                              title="Dar de baja"
                              aria-label={`Dar de baja ${product.name}`}
                              onClick={() => onDelete(product)}
                            >
                              <IconTrash width={16} height={16} />
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}
