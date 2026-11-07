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

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getStockTone = (product: Product): string => {
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
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6}>
                <div className="table-state">
                  <span className="spinner spinner--lg" />
                  <span>Cargando productos...</span>
                </div>
              </td>
            </tr>
          ) : null}

          {!isLoading && products.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="table-state">
                  No encontramos productos con los filtros seleccionados.
                </div>
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link
                      className="cell-product cell-product--link"
                      to={`/dashboard/products/${product.id}`}
                      state={{ from }}
                    >
                      <span className="cell-product__avatar">
                        {getInitials(product.name)}
                      </span>
                      <span>
                        <span className="cell-strong">{product.name}</span>
                        {product.description ? (
                          <span className="cell-muted cell-product__meta">
                            {product.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge--neutral">
                      {product.category?.name ?? "Sin categoría"}
                    </span>
                  </td>
                  <td className="cell-strong">{formatCurrency(product.price)}</td>
                  <td>
                    <span
                      className={`badge badge--${getStockTone(product)}`}
                      title={`Stock mínimo: ${product.minStock} unidades`}
                    >
                      {product.stock} u.
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        product.isActive ? "badge--success" : "badge--neutral"
                      }`}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="table__actions">
                      <Link
                        to={`/dashboard/products/${product.id}`}
                        state={{ from }}
                        className="btn btn--ghost btn--sm"
                      >
                        Ver
                      </Link>

                      {canManage ? (
                        <>
                          <Link
                            to={`/dashboard/products/${product.id}/edit`}
                            state={{ from }}
                            className="icon-btn icon-btn--sm"
                            title="Editar producto"
                            aria-label={`Editar ${product.name}`}
                          >
                            <IconEdit width={16} height={16} />
                          </Link>
                          {product.isActive ? (
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm icon-btn--danger"
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
