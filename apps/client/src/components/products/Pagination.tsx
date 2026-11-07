import { IconChevronLeft, IconChevronRight } from "../icons.tsx";
import type { ProductPagination } from "../../types/product.types.ts";

interface PaginationProps {
  pagination: ProductPagination;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total, totalPages } = pagination;

  return (
    <div className="pagination">
      <p className="pagination__info">
        {total} {total === 1 ? "producto" : "productos"} · Página {page} de{" "}
        {totalPages}
      </p>

      <div className="pagination__actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <IconChevronLeft width={16} height={16} />
          Anterior
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
          <IconChevronRight width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
