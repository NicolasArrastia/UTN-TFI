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
import type {
  Product,
  ProductListParams,
  ProductPagination,
  ProductStatusFilter,
} from "../../types/product.types.ts";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const parseCategoryId = (value: string | null): number | null => {
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
  const categoryId = parseCategoryId(searchParams.get("categoryId"));
  const lowStock = searchParams.get("lowStock") === "true";
  const page = parsePage(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const { categories, isLoading: isCatalogLoading } = useCatalog();

  const params = useMemo<ProductListParams>(
    () => ({
      search: search || undefined,
      categoryId: categoryId ?? undefined,
      isActive: status,
      lowStock,
      page,
      limit: PAGE_SIZE,
    }),
    [search, categoryId, status, lowStock, page],
  );

  const { products, pagination, isLoading, error, reload } =
    useProducts(params);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const canManage = user?.role === "admin";

  useEffect(() => {
    const normalizedSearch = debouncedSearch.trim();

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
  }, [debouncedSearch, search, searchParams, setSearchParams]);

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

  const handleLowStockChange = (value: boolean) => {
    applyFilters({ lowStock: value ? "true" : null });
  };

  const handlePageChange = (nextPage: number) => {
    applyFilters({ page: String(nextPage) });
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
    <section className="card">
      <div className="card__header card__header--stack">
        <div>
          <h2 className="card__title">Catálogo de productos</h2>
          <p className="card__subtitle">
            {error
              ? "No se pudo cargar el catálogo"
              : `${getResultLabel(pagination, isLoading)} · precios en ARS`}
          </p>
        </div>

        <div className="toolbar">
          {canManage ? (
            <Link
              to="/dashboard/products/new"
              className="btn btn--primary btn--sm"
            >
              <IconPlus width={16} height={16} />
              Nuevo producto
            </Link>
          ) : null}

          <button
            type="button"
            className="icon-btn"
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
              className="btn btn--ghost btn--sm"
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
