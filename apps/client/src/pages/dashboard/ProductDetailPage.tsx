import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
import { getPreviousPath } from "../../utils/navigation.ts";

const parseProductId = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const BACK_LINK =
  "inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-brand";

const PAGE_SHELL = "grid gap-3.5";

const CARD =
  "overflow-hidden rounded-card border border-line bg-white shadow-card";

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";

const BADGE_TONES = {
  success: "bg-success-soft text-green-700",
  warning: "bg-warning-soft text-amber-700",
  danger: "bg-danger-soft text-red-700",
  neutral: "bg-slate-100 text-slate-600",
};

type BadgeTone = keyof typeof BADGE_TONES;

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

const TOOLBAR = "flex flex-wrap items-center gap-2.5";

const STATE_ROW =
  "flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted";

const LARGE_SPINNER =
  "size-8 animate-spin rounded-full border-[3px] border-line border-t-brand";

const getStockTone = (stock: number, lowStock: boolean): BadgeTone => {
  if (stock === 0) return "danger";
  if (lowStock) return "warning";
  return "success";
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
  const location = useLocation();

  const listPath = getPreviousPath(location.state, "/dashboard/products");
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
      navigate(listPath, { replace: true });
    } catch (deleteError) {
      notify.error(getProductErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  if (id === null) {
    return (
      <div className={PAGE_SHELL}>
        <Link to={listPath} className={BACK_LINK}>
          <IconChevronLeft width={16} height={16} />
          Volver al listado
        </Link>
        <section className={CARD}>
          <StateCard
            title="Producto no encontrado"
            message="El identificador del producto no es válido."
            action={
              <Link to={listPath} className={GHOST_BUTTON}>
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
      <div className={PAGE_SHELL}>
        <Link to={listPath} className={BACK_LINK}>
          <IconChevronLeft width={16} height={16} />
          Volver al listado
        </Link>
        <section className={CARD}>
          <div className={STATE_ROW}>
            <span className={LARGE_SPINNER} />
            <span>Cargando producto...</span>
          </div>
        </section>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={PAGE_SHELL}>
        <Link to={listPath} className={BACK_LINK}>
          <IconChevronLeft width={16} height={16} />
          Volver al listado
        </Link>
        <section className={CARD}>
          <StateCard
            title="No pudimos cargar el producto"
            message={error ?? "El producto no existe."}
            tone="error"
            action={
              <div className={`${TOOLBAR} justify-end`}>
                <Link to={listPath} className={GHOST_BUTTON}>
                  Ir al listado
                </Link>
                <button
                  type="button"
                  className={PRIMARY_BUTTON}
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

  const { cost } = product;

  return (
    <div className={PAGE_SHELL}>
      <Link to={listPath} className={BACK_LINK}>
        <IconChevronLeft width={16} height={16} />
        Volver al listado
      </Link>

      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-4 px-[22px] pb-1 pt-5 max-md:px-4">
          <div className="flex items-center gap-3.5 max-md:items-start">
            <span className="grid size-[52px] flex-none place-items-center rounded-[14px] bg-brand-soft text-base font-bold text-brand-dark">
              {getInitials(product.name)}
            </span>
            <div>
              <h2 className="text-xl tracking-[-0.02em] max-md:text-lg">
                {product.name}
              </h2>
              <p className="mt-[3px] text-[12.5px] text-muted">
                Producto #{product.id} ·{" "}
                {product.category?.name ?? "Sin categoría"}
              </p>
            </div>
          </div>

          <div className={TOOLBAR}>
            <span
              className={`${BADGE} ${
                product.isActive ? BADGE_TONES.success : BADGE_TONES.neutral
              }`}
            >
              {product.isActive ? "Activo" : "Inactivo"}
            </span>

            {canManage ? (
              <>
                <Link
                  to={`/dashboard/products/${product.id}/edit`}
                  state={{ from: listPath }}
                  className={PRIMARY_BUTTON}
                >
                  <IconEdit width={16} height={16} />
                  Editar
                </Link>
                {product.isActive ? (
                  <button
                    type="button"
                    className={GHOST_BUTTON}
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    <IconTrash width={16} height={16} />
                    Dar de baja
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="px-[22px] py-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            <div className="rounded-xl border border-line bg-[#fbfcfe] px-[18px] py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
                Precio de venta
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[19px] font-bold tracking-[-0.01em]">
                {formatCurrency(product.price)}
              </p>
              <p className="mt-1 text-xs text-muted">IVA incluido</p>
            </div>
            {cost === undefined ? null : (
              <>
                <div className="rounded-xl border border-line bg-[#fbfcfe] px-[18px] py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
                    Costo
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[19px] font-bold tracking-[-0.01em]">
                    {formatCurrency(cost)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Costo de reposición
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-[#fbfcfe] px-[18px] py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
                    Margen bruto
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[19px] font-bold tracking-[-0.01em]">
                    {formatCurrency(product.price - cost)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {getMarginHint(product.price, cost)}
                  </p>
                </div>
              </>
            )}
            <div className="rounded-xl border border-line bg-[#fbfcfe] px-[18px] py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
                Stock disponible
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[19px] font-bold tracking-[-0.01em]">
                {product.stock} u.
                <span
                  className={`${BADGE} text-[10.5px] ${
                    BADGE_TONES[getStockTone(product.stock, product.lowStock)]
                  }`}
                >
                  {product.stock === 0
                    ? "Sin stock"
                    : product.lowStock
                      ? "Stock bajo"
                      : "Stock OK"}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">
                Mínimo configurado: {product.minStock} u.
              </p>
            </div>
          </div>

          <div className="mt-[22px] grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[22px] max-[900px]:grid-cols-1">
            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Descripción
              </h3>
              <p className="whitespace-pre-line text-sm leading-[1.6] text-ink-soft">
                {product.description ?? "Este producto no tiene descripción."}
              </p>

              {!product.isActive ? (
                <p className="mt-[18px] rounded-field bg-warning-soft px-3.5 py-3 text-[13px] leading-normal text-amber-800">
                  Este producto está dado de baja. Podés reactivarlo desde
                  Editar y marcando el estado como activo.
                </p>
              ) : null}
            </div>

            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Información
              </h3>
              <dl className="grid gap-[11px]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
                  <dt className="text-[12.5px] text-muted">Categoría</dt>
                  <dd className="text-right text-[13px] font-semibold">
                    {product.category?.name ?? "Sin categoría"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
                  <dt className="text-[12.5px] text-muted">Etiquetas</dt>
                  <dd className="flex flex-wrap justify-end gap-1.5 text-right text-[13px] font-semibold">
                    {product.tags.length === 0 ? (
                      <span className="text-[12.5px] text-muted">
                        Sin etiquetas
                      </span>
                    ) : (
                      product.tags.map((tag) => (
                        <span
                          className={`${BADGE} ${BADGE_TONES.neutral}`}
                          key={tag.id}
                        >
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </span>
                      ))
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
                  <dt className="text-[12.5px] text-muted">Stock mínimo</dt>
                  <dd className="text-right text-[13px] font-semibold">
                    {product.minStock} u.
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
                  <dt className="text-[12.5px] text-muted">Creado</dt>
                  <dd className="text-right text-[13px] font-semibold">
                    {formatDateTime(product.createdAt)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[12.5px] text-muted">
                    Última modificación
                  </dt>
                  <dd className="text-right text-[13px] font-semibold">
                    {formatDateTime(product.updatedAt)}
                  </dd>
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
