import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StateCard } from "../../components/StateCard.tsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";
import { authenticatedRequest } from "../../services/api-client.ts";
import { notify } from "../../services/notifications.ts";
import { paymentMethodLabels } from "../../utils/labels.ts";

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 350;

const CARD =
  "overflow-hidden rounded-card border border-line bg-white shadow-card";
const CARD_HEADER =
  "flex flex-wrap items-start justify-between gap-4 px-[22px] pt-5 pb-1";
const CARD_HEADER_PLAIN = "flex items-start justify-between gap-4 px-[22px] pt-5";
const CARD_TITLE = "text-[15px] font-bold tracking-[-0.01em]";
const CARD_SUBTITLE = "mt-[3px] text-[12.5px] text-muted";
const CARD_BODY = "px-[22px] py-5";

const BTN =
  "inline-flex items-center justify-center gap-2 rounded-field px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-65";
const BTN_PRIMARY = `${BTN} bg-brand text-white hover:bg-brand-dark`;
const BTN_GHOST = `${BTN} border border-line text-ink-soft hover:border-slate-300 hover:bg-slate-50`;
const BTN_DANGER = `${BTN} bg-danger text-white hover:bg-red-700`;

const TABLE = "w-full border-collapse text-[13.5px]";
const TH =
  "whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4";
const TD =
  "whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4";
const TBODY = "[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50";

const FIELD = "flex flex-col gap-[7px]";
const FIELD_LABEL = "text-[13px] font-semibold text-ink-soft";
const FIELD_CONTROL =
  "w-full rounded-field border border-line bg-white px-[13px] py-[11px] text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13 disabled:bg-slate-50 disabled:text-muted aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-[#fff7f7]";

const PAGINATION =
  "flex flex-wrap items-center justify-between gap-3 border-t border-line px-[22px] py-3.5 max-md:px-4";

const CONTENT_GRID =
  "grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5 max-[1100px]:grid-cols-1";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface CatalogProduct {
  id: number;
  name: string;
  price: string;
  stock: number;
}

interface CatalogResponse {
  products: CatalogProduct[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

interface SaleItem {
  product: CatalogProduct;
  quantity: number;
}

type CatalogState =
  | { key: string; data: CatalogResponse }
  | { key: string; error: string };

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const priceInCents = (price: string): number => Math.round(Number(price) * 100);

export function SaleCreatePage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitting = useRef(false);

  const search = searchInput.trim();
  const debouncedSearch = useDebouncedValue(search, SEARCH_DELAY_MS);
  const requestKey = JSON.stringify([debouncedSearch, page, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    authenticatedRequest<CatalogResponse>(`/sales/catalog?${params}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setCatalog({ key: requestKey, data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCatalog({
            key: requestKey,
            error: errorMessage(error, "No se pudo cargar el catálogo."),
          });
        }
      });

    return () => controller.abort();
  }, [debouncedSearch, page, requestKey]);

  const currentCatalog = catalog?.key === requestKey ? catalog : null;
  const isSearching = search !== debouncedSearch || currentCatalog === null;
  const catalogError =
    currentCatalog && "error" in currentCatalog ? currentCatalog.error : null;
  const catalogData =
    currentCatalog && "data" in currentCatalog ? currentCatalog.data : null;
  const products = catalogData?.products ?? [];

  const totalInCents = items.reduce(
    (total, { product, quantity }) =>
      total + priceInCents(product.price) * quantity,
    0,
  );

  const addProduct = (product: CatalogProduct) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      const quantity = (existing?.quantity ?? 0) + 1;

      if (quantity > product.stock) {
        return current;
      }

      if (!existing) {
        return [...current, { product, quantity }];
      }

      return current.map((item) =>
        item.product.id === product.id ? { product, quantity } : item,
      );
    });
  };

  const decreaseQuantity = (productId: number) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );
  };

  const removeProduct = (productId: number) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  };

  const confirmSale = async () => {
    if (submitting.current || items.length === 0 || !paymentMethod) {
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { sale } = await authenticatedRequest<{ sale: { number: number } }>(
        "/sales",
        {
          method: "POST",
          body: JSON.stringify({
            paymentMethod,
            items: items.map(({ product, quantity }) => ({
              productId: product.id,
              quantity,
            })),
          }),
        },
      );

      notify.success(`Venta ${sale.number} registrada correctamente.`);
      navigate("/dashboard/sales", { replace: true });
    } catch (error) {
      setSubmitError(errorMessage(error, "No se pudo confirmar la venta."));
      setRefresh((current) => current + 1);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className={CARD}>
        <div className={CARD_HEADER}>
          <div>
            <h2 className={CARD_TITLE}>Agregar venta</h2>
            <p className={CARD_SUBTITLE}>
              Buscá los productos que querés incluir en la venta.
            </p>
          </div>

          {!isSubmitting && (
            <Link to="/dashboard/sales" className={BTN_GHOST}>
              Volver a ventas
            </Link>
          )}
        </div>
      </section>

      <div className={CONTENT_GRID}>
        <section className={CARD} aria-labelledby="sale-catalog-title">
          <div className={CARD_HEADER_PLAIN}>
            <h3 id="sale-catalog-title" className={CARD_TITLE}>
              Catálogo de productos
            </h3>
          </div>

          <div className={CARD_BODY}>
            <div className={FIELD}>
              <label
                htmlFor="sale-product-search"
                className={FIELD_LABEL}
              >
                Buscar por nombre
              </label>
              <input
                id="sale-product-search"
                type="search"
                className={FIELD_CONTROL}
                placeholder="Escribí el nombre de un producto"
                value={searchInput}
                maxLength={150}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {isSearching ? (
            <StateCard
              title="Cargando productos"
              message="Estamos consultando el catálogo."
            />
          ) : catalogError ? (
            <StateCard
              title="No pudimos cargar los productos"
              message={catalogError}
              tone="error"
              action={
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={() => setRefresh((current) => current + 1)}
                >
                  Reintentar
                </button>
              }
            />
          ) : (
            <>
              {products.length === 0 ? (
                <StateCard
                  title="No hay productos para mostrar"
                  message={
                    search
                      ? "Probá con otro nombre o borrá la búsqueda."
                      : "No hay productos activos en esta página."
                  }
                />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className={TABLE} aria-label="Productos para la venta">
                    <thead>
                      <tr>
                        <th scope="col" className={TH}>
                          Producto
                        </th>
                        <th scope="col" className={TH}>
                          Precio
                        </th>
                        <th scope="col" className={TH}>
                          Disponible
                        </th>
                        <th scope="col" className={TH}>
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className={TBODY}>
                      {products.map((product) => {
                        const quantity =
                          items.find((item) => item.product.id === product.id)
                            ?.quantity ?? 0;
                        const available = Math.max(0, product.stock - quantity);

                        return (
                          <tr key={product.id}>
                            <td className={`${TD} font-semibold text-ink`}>
                              {product.name}
                            </td>
                            <td className={TD}>
                              {priceFormatter.format(Number(product.price))}
                            </td>
                            <td className={TD}>{available}</td>
                            <td className={TD}>
                              <button
                                type="button"
                                className={BTN_PRIMARY}
                                aria-label={`Agregar ${product.name}`}
                                disabled={isSubmitting || available < 1}
                                onClick={() => addProduct(product)}
                              >
                                Agregar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(page > 1 || catalogData?.pagination.hasNextPage) && (
                <div className={PAGINATION}>
                  <p className="text-[12.5px] text-muted">Página {page}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={BTN_GHOST}
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className={BTN_GHOST}
                      disabled={!catalogData?.pagination.hasNextPage}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className={CARD} aria-labelledby="sale-selection-title">
          <div className={CARD_HEADER_PLAIN}>
            <h3 id="sale-selection-title" className={CARD_TITLE}>
              Productos seleccionados
            </h3>
          </div>

          {items.length === 0 ? (
            <div className={CARD_BODY}>
              <p className={CARD_SUBTITLE}>
                Todavía no hay productos seleccionados.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className={TABLE} aria-label="Productos seleccionados">
                <thead>
                  <tr>
                    <th scope="col" className={TH}>
                      Producto
                    </th>
                    <th scope="col" className={TH}>
                      Cantidad
                    </th>
                    <th scope="col" className={TH}>
                      Subtotal
                    </th>
                    <th scope="col" className={TH}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {items.map(({ product, quantity }) => {
                    const currentProduct =
                      products.find((entry) => entry.id === product.id) ??
                      product;
                    const subtotal =
                      (priceInCents(product.price) * quantity) / 100;

                    return (
                      <tr key={product.id}>
                        <td className={`${TD} font-semibold text-ink`}>
                          {product.name}
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className={BTN_GHOST}
                              aria-label={`Restar una unidad de ${product.name}`}
                              disabled={isSubmitting || quantity <= 1}
                              onClick={() => decreaseQuantity(product.id)}
                            >
                              −
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              className={BTN_GHOST}
                              aria-label={`Sumar una unidad de ${product.name}`}
                              disabled={
                                isSubmitting ||
                                quantity + 1 > currentProduct.stock
                              }
                              onClick={() => addProduct(currentProduct)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className={TD}>{priceFormatter.format(subtotal)}</td>
                        <td className={TD}>
                          <button
                            type="button"
                            className={BTN_DANGER}
                            aria-label={`Quitar ${product.name}`}
                            disabled={isSubmitting}
                            onClick={() => removeProduct(product.id)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className={`${CARD_BODY} grid gap-4`}>
            <p aria-live="polite">
              <strong>Total {priceFormatter.format(totalInCents / 100)}</strong>
            </p>

            <div className={`${FIELD} w-full max-w-[300px]`}>
              <label htmlFor="sale-payment-method" className={FIELD_LABEL}>
                Método de pago
              </label>
              <select
                id="sale-payment-method"
                className={`${FIELD_CONTROL} cursor-pointer`}
                value={paymentMethod}
                disabled={isSubmitting}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="" disabled>
                  Seleccioná un método de pago
                </option>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid justify-items-start gap-2">
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={items.length === 0 || !paymentMethod || isSubmitting}
                onClick={confirmSale}
              >
                {isSubmitting ? "Registrando venta..." : "Confirmar venta"}
              </button>

              {submitError && <p role="alert">{submitError}</p>}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
