import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog.tsx";
import { StateCard } from "../../components/StateCard.tsx";
import { IconPlus, IconRefresh } from "../../components/icons.tsx";
import { Pagination } from "../../components/products/Pagination.tsx";
import { ProductFilters } from "../../components/products/ProductFilters.tsx";
import { ProductTable } from "../../components/products/ProductTable.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { useCatalog } from "../../hooks/useCatalog.ts";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";
import { useProducts } from "../../hooks/useProducts.ts";
import { productService } from "../../services/product.service.ts";
import {
  getProductErrorMessage,
  notify,
} from "../../services/notifications.ts";
import {
  PRODUCT_SORT_FIELDS,
  type Product,
  type ProductListParams,
  type ProductPagination,
  type ProductSortBy,
  type ProductStatusFilter,
} from "../../types/product.types.ts";
import type { SortDir } from "../../types/sort.types.ts";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_SORT_BY: ProductSortBy = "name";
const DEFAULT_SORT_DIR: SortDir = "asc";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

const ICON_BUTTON =
  "inline-flex size-[38px] items-center justify-center rounded-field border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const parsePositiveId = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parsePage = (value: string | null): number => {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const parseSortBy = (value: string | null): ProductSortBy => {
  if (value !== null && PRODUCT_SORT_FIELDS.includes(value as ProductSortBy)) {
    return value as ProductSortBy;
  }

  return DEFAULT_SORT_BY;
};

const parseSortDir = (value: string | null): SortDir => {
  if (value === "asc" || value === "desc") {
    return value;
  }

  return DEFAULT_SORT_DIR;
};

const parseStatus = (value: string | null): ProductStatusFilter => {
  if (value === "all") {
    return "all";
  }

  if (value === "false") {
    return false;
  }

  return true;
};

const getResultLabel = (
  pagination: ProductPagination | null,
  isLoading: boolean,
): string => {
  if (isLoading) {
    return "Cargando productos...";
  }

  const total = pagination?.total ?? 0;
  return `${total} ${total === 1 ? "producto" : "productos"}`;
};

export function ProductsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = parseStatus(searchParams.get("isActive"));
  const categoryId = parsePositiveId(searchParams.get("categoryId"));
  const tagId = parsePositiveId(searchParams.get("tagId"));
  const lowStock = searchParams.get("lowStock") === "true";
  const page = parsePage(searchParams.get("page"));
  const sortBy = parseSortBy(searchParams.get("sortBy"));
  const sortDir = parseSortDir(searchParams.get("sortDir"));

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const { categories, tags, isLoading: isCatalogLoading } = useCatalog();

  const params = useMemo<ProductListParams>(
    () => ({
      search: search || undefined,
      categoryId: categoryId ?? undefined,
      tagId: tagId ?? undefined,
      isActive: status,
      lowStock,
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortDir,
    }),
    [search, categoryId, tagId, status, lowStock, page, sortBy, sortDir],
  );

  const { products, pagination, isLoading, error, reload } =
    useProducts(params);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const canManage = user?.role === "admin";

  useEffect(() => {
    const normalizedSearch = debouncedSearch.trim();

    // Evita que un valor debounceado viejo pise lo que el usuario ya escribió
    // o el search que acaba de confirmar un cambio de filtro.
    if (normalizedSearch !== searchInput.trim()) {
      return;
    }

    if (normalizedSearch === search) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (normalizedSearch) {
      next.set("search", normalizedSearch);
    } else {
      next.delete("search");
    }

    next.delete("page");
    setSearchParams(next, { replace: true });
  }, [
    debouncedSearch,
    search,
    searchInput,
    searchParams,
    setSearchParams,
  ]);

  const applyFilters = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (!("search" in changes)) {
      const normalizedSearch = searchInput.trim();

      if (normalizedSearch) {
        next.set("search", normalizedSearch);
      } else {
        next.delete("search");
      }
    }

    if (!("page" in changes)) {
      next.delete("page");
    }

    setSearchParams(next, { replace: true });
  };

  const handleStatusChange = (value: ProductStatusFilter) => {
    applyFilters({
      isActive: value === true ? null : String(value),
    });
  };

  const handleCategoryChange = (value: number | null) => {
    applyFilters({
      categoryId: value === null ? null : String(value),
    });
  };

  const handleTagChange = (value: number | null) => {
    applyFilters({
      tagId: value === null ? null : String(value),
    });
  };

  const handleLowStockChange = (value: boolean) => {
    applyFilters({ lowStock: value ? "true" : null });
  };

  const handlePageChange = (nextPage: number) => {
    applyFilters({ page: String(nextPage) });
  };

  const handleSortChange = (nextSortBy: ProductSortBy, nextSortDir: SortDir) => {
    applyFilters({
      sortBy: nextSortBy === DEFAULT_SORT_BY ? null : nextSortBy,
      sortDir: nextSortDir === DEFAULT_SORT_DIR ? null : nextSortDir,
    });
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await productService.remove(productToDelete.id);
      notify.success(`Se dio de baja "${productToDelete.name}".`);
      setProductToDelete(null);

      if (products.length === 1 && page > 1) {
        applyFilters({ page: String(page - 1) });
      } else {
        reload();
      }
    } catch (deleteError) {
      notify.error(getProductErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 px-[22px] pb-1 pt-5 max-md:px-4">
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.01em]">
            Catálogo de productos
          </h2>
          <p className="mt-[3px] text-[12.5px] text-muted">
            {error
              ? "No se pudo cargar el catálogo"
              : `${getResultLabel(pagination, isLoading)} · precios en ARS`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage ? (
            <Link to="/dashboard/products/new" className={PRIMARY_BUTTON}>
              <IconPlus width={16} height={16} />
              Nuevo producto
            </Link>
          ) : null}

          <button
            type="button"
            className={ICON_BUTTON}
            onClick={reload}
            aria-label="Actualizar listado"
            title="Actualizar listado"
          >
            <IconRefresh width={18} height={18} />
          </button>
        </div>
      </div>

      <ProductFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={handleStatusChange}
        categoryId={categoryId}
        categories={categories}
        isCatalogLoading={isCatalogLoading}
        onCategoryChange={handleCategoryChange}
        tagId={tagId}
        tags={tags}
        onTagChange={handleTagChange}
        lowStock={lowStock}
        onLowStockChange={handleLowStockChange}
      />

      {error ? (
        <StateCard
          title="No pudimos cargar los productos"
          message={error}
          tone="error"
          action={
            <button
              type="button"
              className={GHOST_BUTTON}
              onClick={reload}
            >
              Reintentar
            </button>
          }
        />
      ) : (
        <>
          <ProductTable
            products={products}
            isLoading={isLoading}
            canManage={canManage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onDelete={setProductToDelete}
          />

          {!isLoading && pagination && pagination.total > 0 ? (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          ) : null}
        </>
      )}

      {productToDelete ? (
        <ConfirmDialog
          title="Dar de baja producto"
          message={`¿Confirmás que querés dar de baja "${productToDelete.name}"? Dejará de aparecer en el listado de activos, pero podrás reactivarlo editándolo.`}
          confirmLabel="Dar de baja"
          tone="danger"
          isBusy={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setProductToDelete(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
