import type { ProductPagination } from "../../types/product.types.ts";
import { IconChevronLeft, IconChevronRight } from "../icons.tsx";

interface PaginationProps {
  pagination: ProductPagination;
  onPageChange: (page: number) => void;
}

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total, totalPages } = pagination;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-[22px] py-3.5 max-md:px-4">
      <p className="text-[12.5px] text-muted">
        {total} {total === 1 ? "producto" : "productos"} · Página {page} de{" "}
        {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={BUTTON}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <IconChevronLeft width={16} height={16} />
          Anterior
        </button>
        <button
          type="button"
          className={BUTTON}
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
