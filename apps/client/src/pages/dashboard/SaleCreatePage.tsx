import { useState } from "react";
import { Link } from "react-router-dom";
import { StateCard } from "../../components/StateCard.tsx";
import { Pagination } from "../../components/products/Pagination.tsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";
import { useProducts } from "../../hooks/useProducts.ts";
import type { Product } from "../../types/product.types.ts";
import { paymentMethodLabels } from "../../utils/labels.ts";

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 350;

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface SaleItem {
  product: Product;
  quantity: number;
}

export function SaleCreatePage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");

  const search = searchInput.trim();
  const debouncedSearch = useDebouncedValue(search, SEARCH_DELAY_MS);

  const { products, pagination, isLoading, error, reload } = useProducts({
    search: debouncedSearch || undefined,
    isActive: true,
    page,
    limit: PAGE_SIZE,
  });

  const isSearching = isLoading || search !== debouncedSearch;
  const totalInCents = items.reduce(
    (total, { product, quantity }) =>
      total + Math.round(product.price * 100) * quantity,
    0,
  );

  const addProduct = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      const nextQuantity = (existing?.quantity ?? 0) + 1;

      if (nextQuantity > product.stock) {
        return current;
      }

      if (!existing) {
        return [...current, { product, quantity: 1 }];
      }

      return current.map((item) =>
        item.product.id === product.id
          ? { product, quantity: nextQuantity }
          : item,
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

          <Link to="/dashboard/sales" className="btn btn--ghost btn--sm">
            Volver a ventas
          </Link>
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
          ) : error ? (
            <StateCard
              title="No pudimos cargar los productos"
              message={error}
              tone="error"
              action={
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={reload}
                >
                  Reintentar
                </button>
              }
            />
          ) : products.length === 0 ? (
            <StateCard
              title="No hay productos para mostrar"
              message={
                search
                  ? "Probá con otro nombre o borrá la búsqueda."
                  : "No hay productos activos en el catálogo."
              }
            />
          ) : (
            <>
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
                      const availableStock = Math.max(
                        0,
                        product.stock - quantity,
                      );

                      return (
                        <tr key={product.id}>
                          <td className="cell-strong">{product.name}</td>
                          <td>{priceFormatter.format(product.price)}</td>
                          <td>{availableStock}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              aria-label={`Agregar ${product.name}`}
                              disabled={availableStock < 1}
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

              {pagination && pagination.totalPages > 1 ? (
                <Pagination pagination={pagination} onPageChange={setPage} />
              ) : null}
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
                    const subtotalInCents =
                      Math.round(product.price * 100) * quantity;

                    return (
                      <tr key={product.id}>
                        <td className="cell-strong">{product.name}</td>
                        <td>
                          <div className="table__actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              aria-label={`Restar una unidad de ${product.name}`}
                              disabled={quantity <= 1}
                              onClick={() => decreaseQuantity(product.id)}
                            >
                              −
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              aria-label={`Sumar una unidad de ${product.name}`}
                              disabled={quantity + 1 > currentProduct.stock}
                              onClick={() => addProduct(currentProduct)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{priceFormatter.format(subtotalInCents / 100)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            aria-label={`Quitar ${product.name}`}
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
                aria-describedby="sale-confirmation-note"
                disabled
              >
                Confirmar venta
              </button>

              <p id="sale-confirmation-note" className="card__subtitle">
                Por ahora, las ventas no se guardan ni descuentan stock.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
