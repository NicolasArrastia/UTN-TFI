import { IconSearch } from "../icons.tsx";
import type { Category, Tag } from "../../types/catalog.types.ts";
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
  tagId: number | null;
  tags: Tag[];
  onTagChange: (tagId: number | null) => void;
  lowStock: boolean;
  onLowStockChange: (value: boolean) => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: ProductStatusFilter }> = [
  { label: "Activos", value: true },
  { label: "Inactivos", value: false },
  { label: "Todos", value: "all" },
];

const FILTER_SELECT =
  "cursor-pointer rounded-field border border-line bg-white py-[9px] pl-3 pr-[34px] text-[13.5px] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/12 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted max-md:w-full";

export function ProductFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  categoryId,
  categories,
  isCatalogLoading,
  onCategoryChange,
  tagId,
  tags,
  onTagChange,
  lowStock,
  onLowStockChange,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-[22px] pb-1.5 pt-4 max-md:px-4">
      <label className="relative flex items-center text-muted max-md:flex-1 max-md:basis-full">
        <IconSearch width={16} height={16} className="pointer-events-none absolute left-3" />
        <input
          type="search"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Buscar producto por nombre"
          className="w-[260px] max-w-full rounded-field border border-line bg-white py-[9px] pl-9 pr-3 text-[13.5px] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/12 max-md:w-full"
        />
      </label>

      <div className="inline-flex gap-0.5 rounded-[11px] border border-line bg-white p-1" aria-label="Filtrar por estado">
        {STATUS_OPTIONS.map((option) => {
          const isActive = status === option.value;

          return (
            <button
              key={option.label}
              type="button"
              className={`cursor-pointer rounded-lg border-none px-4 py-[7px] text-[13px] font-semibold transition-colors ${
                isActive ? "bg-brand text-white" : "bg-transparent text-muted"
              }`}
              onClick={() => onStatusChange(option.value)}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <select
        className={FILTER_SELECT}
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

      <select
        className={FILTER_SELECT}
        value={tagId ?? ""}
        onChange={(event) =>
          onTagChange(
            event.target.value === "" ? null : Number(event.target.value),
          )
        }
        aria-label="Filtrar por etiqueta"
        disabled={isCatalogLoading}
      >
        <option value="">Todas las etiquetas</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] font-medium text-ink-soft">
        <input
          type="checkbox"
          checked={lowStock}
          onChange={(event) => onLowStockChange(event.target.checked)}
          className="size-4 cursor-pointer accent-brand"
        />
        Solo stock bajo
      </label>
    </div>
  );
}
