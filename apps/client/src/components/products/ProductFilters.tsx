import { IconSearch } from "../icons.tsx";
import type { Category } from "../../types/catalog.types.ts";
import type { ProductStatusFilter } from "../../types/product.types.ts";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ProductStatusFilter;
  onStatusChange: (status: ProductStatusFilter) => void;
  categoryId: number | null;
  categories: Category[];
  isCatalogLoading: boolean;
  onCategoryChange: (categoryId: number | null) => void;
  lowStock: boolean;
  onLowStockChange: (value: boolean) => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: ProductStatusFilter }> = [
  { label: "Activos", value: true },
  { label: "Inactivos", value: false },
  { label: "Todos", value: "all" },
];

export function ProductFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  categoryId,
  categories,
  isCatalogLoading,
  onCategoryChange,
  lowStock,
  onLowStockChange,
}: ProductFiltersProps) {
  return (
    <div className="toolbar product-filters">
      <label className="search">
        <IconSearch width={16} height={16} />
        <input
          type="search"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Buscar producto por nombre"
        />
      </label>

      <div className="segmented" aria-label="Filtrar por estado">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={`segmented__item${
              status === option.value ? " is-active" : ""
            }`}
            onClick={() => onStatusChange(option.value)}
            aria-pressed={status === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <select
        className="toolbar__select"
        value={categoryId ?? ""}
        onChange={(event) =>
          onCategoryChange(
            event.target.value === "" ? null : Number(event.target.value),
          )
        }
        aria-label="Filtrar por categoría"
        disabled={isCatalogLoading}
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label className="check-inline">
        <input
          type="checkbox"
          checked={lowStock}
          onChange={(event) => onLowStockChange(event.target.checked)}
        />
        Solo stock bajo
      </label>
    </div>
  );
}
