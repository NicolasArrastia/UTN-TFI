import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StateCard } from "../../components/StateCard.tsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";
import { authenticatedRequest } from "../../services/api-client.ts";
import { notify } from "../../services/notifications.ts";
import { paymentMethodLabels } from "../../utils/labels.ts";

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 350;

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
      <section className="card">
        <div className="card__header card__header--stack">
          <div>
            <h2 className="card__title">Agregar venta</h2>
            <p className="card__subtitle">
              Buscá los productos que querés incluir en la venta.
            </p>
          </div>

          {!isSubmitting && (
            <Link to="/dashboard/sales" className="btn btn--ghost btn--sm">
              Volver a ventas
            </Link>
          )}
        </div>
      </section>

      <div className="content-grid">
        <section className="card" aria-labelledby="sale-catalog-title">
          <div className="card__header">
            <h3 id="sale-catalog-title" className="card__title">
              Catálogo de productos
            </h3>
          </div>

          <div className="card__body">
            <div className="field">
              <label htmlFor="sale-product-search">Buscar por nombre</label>
              <input
                id="sale-product-search"
                type="search"
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
                  className="btn btn--ghost btn--sm"
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
                <div className="table-wrap">
                  <table className="table" aria-label="Productos para la venta">
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Disponible</th>
                        <th scope="col">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const quantity =
                          items.find((item) => item.product.id === product.id)
                            ?.quantity ?? 0;
                        const available = Math.max(0, product.stock - quantity);

                        return (
                          <tr key={product.id}>
                            <td className="cell-strong">{product.name}</td>
                            <td>
                              {priceFormatter.format(Number(product.price))}
                            </td>
                            <td>{available}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
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
                <div className="pagination">
                  <p className="pagination__info">Página {page}</p>
                  <div className="pagination__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
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

        <section className="card" aria-labelledby="sale-selection-title">
          <div className="card__header">
            <h3 id="sale-selection-title" className="card__title">
              Productos seleccionados
            </h3>
          </div>

          {items.length === 0 ? (
            <div className="card__body">
              <p className="card__subtitle">
                Todavía no hay productos seleccionados.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table" aria-label="Productos seleccionados">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Subtotal</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ product, quantity }) => {
                    const currentProduct =
                      products.find((entry) => entry.id === product.id) ??
                      product;
                    const subtotal =
                      (priceInCents(product.price) * quantity) / 100;

                    return (
                      <tr key={product.id}>
                        <td className="cell-strong">{product.name}</td>
                        <td>
                          <div className="table__actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              aria-label={`Restar una unidad de ${product.name}`}
                              disabled={isSubmitting || quantity <= 1}
                              onClick={() => decreaseQuantity(product.id)}
                            >
                              −
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
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
                        <td>{priceFormatter.format(subtotal)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
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

          <div className="card__body" style={{ display: "grid", gap: 16 }}>
            <p aria-live="polite">
              <strong>Total {priceFormatter.format(totalInCents / 100)}</strong>
            </p>

            <div className="field" style={{ width: "100%", maxWidth: 300 }}>
              <label htmlFor="sale-payment-method">Método de pago</label>
              <select
                id="sale-payment-method"
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

            <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
              <button
                type="button"
                className="btn btn--primary btn--sm"
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
