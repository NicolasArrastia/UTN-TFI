import { useState } from "react";
import { IconPlus, IconSearch } from "../../components/icons.tsx";
import { notify } from "../../services/notifications.ts";
import { formatCurrency } from "../../utils/format.ts";

interface MockProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  isActive: boolean;
}

const products: MockProduct[] = [
  {
    id: 1,
    name: "Café molido 500 g",
    category: "Almacén",
    price: 4_200,
    stock: 34,
    minStock: 10,
    isActive: true,
  },
  {
    id: 2,
    name: "Yerba mate 1 kg",
    category: "Almacén",
    price: 6_500,
    stock: 8,
    minStock: 12,
    isActive: true,
  },
  {
    id: 3,
    name: "Detergente 750 ml",
    category: "Limpieza",
    price: 3_100,
    stock: 0,
    minStock: 6,
    isActive: false,
  },
  {
    id: 4,
    name: "Pan lactal integral",
    category: "Panadería",
    price: 2_800,
    stock: 21,
    minStock: 8,
    isActive: true,
  },
  {
    id: 5,
    name: "Agua mineral 2 L",
    category: "Bebidas",
    price: 1_900,
    stock: 56,
    minStock: 20,
    isActive: true,
  },
];

const getStockTone = (product: MockProduct): string => {
  if (product.stock === 0) return "danger";
  if (product.stock <= product.minStock) return "warning";
  return "success";
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function ProductsPage() {
  const [query, setQuery] = useState("");

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <section className="card">
      <div className="card__header card__header--stack">
        <div>
          <h2 className="card__title">Catálogo de productos</h2>
          <p className="card__subtitle">
            {filteredProducts.length} productos · datos de ejemplo
          </p>
        </div>

        <div className="toolbar">
          <label className="search">
            <IconSearch width={16} height={16} />
            <input
              type="search"
              placeholder="Buscar producto o categoría..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar producto"
            />
          </label>

          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() =>
              notify.info("La gestión de productos estará disponible pronto.")
            }
          >
            <IconPlus width={16} height={16} />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="cell-product">
                    <span className="cell-product__avatar">
                      {getInitials(product.name)}
                    </span>
                    <span className="cell-strong">{product.name}</span>
                  </div>
                </td>
                <td>
                  <span className="badge badge--neutral">{product.category}</span>
                </td>
                <td className="cell-strong">{formatCurrency(product.price)}</td>
                <td>
                  <span
                    className={`badge badge--${getStockTone(product)}`}
                    title={`Mínimo: ${product.minStock} unidades`}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="empty-state">
          No encontramos productos para “{query}”.
        </p>
      ) : null}
    </section>
  );
}
