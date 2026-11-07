import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog.tsx";
import { StateCard } from "../../components/StateCard.tsx";
import {
  IconChevronLeft,
  IconEdit,
  IconTrash,
} from "../../components/icons.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { useProduct } from "../../hooks/useProduct.ts";
import { productService } from "../../services/product.service.ts";
import {
  getProductErrorMessage,
  notify,
} from "../../services/notifications.ts";
import {
  formatCurrency,
  formatDateTime,
} from "../../utils/format.ts";

const parseProductId = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getStockTone = (stock: number, lowStock: boolean): string => {
  if (stock === 0) return "danger";
  if (lowStock) return "warning";
  return "success";
};

const getMarginHint = (price: number, cost: number): string => {
  if (price <= 0) {
    return "Sin precio de venta definido";
  }

  const margin = ((price - cost) / price) * 100;
  return `${margin.toFixed(1)}% sobre el precio`;
};

export function ProductDetailPage() {
  const { user } = useAuth();
  const { id: idParam } = useParams();
  const navigate = useNavigate();

  const id = parseProductId(idParam);
  const { product, isLoading, error, reload } = useProduct(id);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canManage = user?.role === "admin";

  const handleConfirmDelete = async () => {
    if (!product) {
      return;
    }

    setIsDeleting(true);

    try {
      await productService.remove(product.id);
      notify.success(`Se dio de baja "${product.name}".`);
      navigate("/dashboard/products", { replace: true });
    } catch (deleteError) {
      notify.error(getProductErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  if (id === null) {
    return (
      <div className="detail-page">
        <Link to="/dashboard/products" className="back-link">
          <IconChevronLeft width={16} height={16} />
          Volver al listado
        </Link>
        <section className="card">
          <StateCard
            title="Producto no encontrado"
            message="El identificador del producto no es válido."
            action={
              <Link to="/dashboard/products" className="btn btn--ghost btn--sm">
                Ir al listado
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="detail-page">
        <Link to="/dashboard/products" className="back-link">
          <IconChevronLeft width={16} height={16} />
          Volver al listado
        </Link>
        <section className="card">
          <div className="table-state">
            <span className="spinner spinner--lg" />
            <span>Cargando producto...</span>
          </div>
        </section>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="detail-page">
        <Link to="/dashboard/products" className="back-link">
          <IconChevronLeft width={16} height={16} />
          Volver al listado
        </Link>
        <section className="card">
          <StateCard
            title="No pudimos cargar el producto"
            message={error ?? "El producto no existe."}
            tone="error"
            action={
              <div className="toolbar toolbar--end">
                <Link
                  to="/dashboard/products"
                  className="btn btn--ghost btn--sm"
                >
                  Ir al listado
                </Link>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={reload}
                >
                  Reintentar
                </button>
              </div>
            }
          />
        </section>
      </div>
    );
  }

  const margin = product.price - product.cost;

  return (
    <div className="detail-page">
      <Link to="/dashboard/products" className="back-link">
        <IconChevronLeft width={16} height={16} />
        Volver al listado
      </Link>

      <section className="card">
        <div className="card__header card__header--stack">
          <div className="detail-heading">
            <span className="detail-avatar">{getInitials(product.name)}</span>
            <div>
              <h2 className="detail-title">{product.name}</h2>
              <p className="card__subtitle">
                Producto #{product.id} ·{" "}
                {product.category?.name ?? "Sin categoría"}
              </p>
            </div>
          </div>

          <div className="toolbar">
            <span
              className={`badge ${
                product.isActive ? "badge--success" : "badge--neutral"
              }`}
            >
              {product.isActive ? "Activo" : "Inactivo"}
            </span>

            {canManage ? (
              <>
                <Link
                  to={`/dashboard/products/${product.id}/edit`}
                  className="btn btn--primary btn--sm"
                >
                  <IconEdit width={16} height={16} />
                  Editar
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  <IconTrash width={16} height={16} />
                  Dar de baja
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="card__body">
          <div className="detail-stats">
            <div className="detail-stat">
              <p className="detail-stat__label">Precio de venta</p>
              <p className="detail-stat__value">
                {formatCurrency(product.price)}
              </p>
              <p className="detail-stat__hint">IVA incluido</p>
            </div>
            <div className="detail-stat">
              <p className="detail-stat__label">Costo</p>
              <p className="detail-stat__value">{formatCurrency(product.cost)}</p>
              <p className="detail-stat__hint">Costo de reposición</p>
            </div>
            <div className="detail-stat">
              <p className="detail-stat__label">Margen bruto</p>
              <p className="detail-stat__value">{formatCurrency(margin)}</p>
              <p className="detail-stat__hint">
                {getMarginHint(product.price, product.cost)}
              </p>
            </div>
            <div className="detail-stat">
              <p className="detail-stat__label">Stock disponible</p>
              <p className="detail-stat__value">
                {product.stock} u.
                <span
                  className={`badge badge--${getStockTone(
                    product.stock,
                    product.lowStock,
                  )} detail-stat__badge`}
                >
                  {product.stock === 0
                    ? "Sin stock"
                    : product.lowStock
                      ? "Stock bajo"
                      : "Stock OK"}
                </span>
              </p>
              <p className="detail-stat__hint">
                Mínimo configurado: {product.minStock} u.
              </p>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-panel">
              <h3>Descripción</h3>
              <p className="detail-description">
                {product.description ?? "Este producto no tiene descripción."}
              </p>

              {!product.isActive ? (
                <p className="detail-note">
                  Este producto está dado de baja. Podés reactivarlo desde
                  Editar y marcando el estado como activo.
                </p>
              ) : null}
            </div>

            <div className="detail-panel">
              <h3>Información</h3>
              <dl className="detail-list">
                <div>
                  <dt>Categoría</dt>
                  <dd>{product.category?.name ?? "Sin categoría"}</dd>
                </div>
                <div>
                  <dt>Etiquetas</dt>
                  <dd className="detail-tags">
                    {product.tags.length === 0 ? (
                      <span className="cell-muted">Sin etiquetas</span>
                    ) : (
                      product.tags.map((tag) => (
                        <span className="badge badge--neutral" key={tag.id}>
                          <span
                            className="tag-dot"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </span>
                      ))
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Stock mínimo</dt>
                  <dd>{product.minStock} u.</dd>
                </div>
                <div>
                  <dt>Creado</dt>
                  <dd>{formatDateTime(product.createdAt)}</dd>
                </div>
                <div>
                  <dt>Última modificación</dt>
                  <dd>{formatDateTime(product.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {isConfirmingDelete ? (
        <ConfirmDialog
          title="Dar de baja producto"
          message={`¿Confirmás que querés dar de baja "${product.name}"? Dejará de aparecer en el listado de activos, pero podrás reactivarlo editándolo.`}
          confirmLabel="Dar de baja"
          tone="danger"
          isBusy={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setIsConfirmingDelete(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
