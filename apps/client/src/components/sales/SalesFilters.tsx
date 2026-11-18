import { useUsers } from "../../hooks/useUsers.ts";
import type { SaleStatusFilter } from "../../types/sale.types.ts";

interface SalesFiltersProps {
  isAdmin: boolean;
  userId: number | null;
  onUserChange: (userId: number | null) => void;
  from: string | null;
  to: string | null;
  onFromChange: (value: string | null) => void;
  onToChange: (value: string | null) => void;
  status: SaleStatusFilter;
  onStatusChange: (status: SaleStatusFilter) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}

const FILTER_SELECT =
  "cursor-pointer rounded-field border border-line bg-white py-[9px] pl-3 pr-[34px] text-[13.5px] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/12 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted max-md:w-full";

const FILTER_DATE =
  "rounded-field border border-line bg-white py-[9px] pl-3 pr-2 text-[13.5px] text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/12 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted max-md:w-full";

const FILTER_LABEL = "text-[12.5px] font-semibold text-ink-soft";

const CLEAR_BUTTON =
  "cursor-pointer rounded-field border border-line bg-white px-3 py-[9px] text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50";

const STATUS_OPTIONS: Array<{ label: string; value: SaleStatusFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Completadas", value: "completed" },
  { label: "Anuladas", value: "cancelled" },
];

function EmployeeFilter({
  userId,
  onUserChange,
}: {
  userId: number | null;
  onUserChange: (userId: number | null) => void;
}) {
  const { users, isLoading } = useUsers(true);

  return (
    <select
      className={FILTER_SELECT}
      value={userId ?? ""}
      onChange={(event) =>
        onUserChange(
          event.target.value === "" ? null : Number(event.target.value),
        )
      }
      aria-label="Filtrar por empleado"
      disabled={isLoading}
    >
      <option value="">Todos</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.fullname}
        </option>
      ))}
    </select>
  );
}

export function SalesFilters({
  isAdmin,
  userId,
  onUserChange,
  from,
  to,
  onFromChange,
  onToChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onClear,
}: SalesFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-2.5 px-[22px] pb-1.5 pt-4 max-md:px-4">
      {isAdmin ? (
        <label className="flex flex-col gap-1 max-md:w-full">
          <span className={FILTER_LABEL}>Empleado</span>
          <EmployeeFilter userId={userId} onUserChange={onUserChange} />
        </label>
      ) : null}

      <label className="flex flex-col gap-1 max-md:w-full">
        <span className={FILTER_LABEL}>Desde</span>
        <input
          type="date"
          className={FILTER_DATE}
          value={from ?? ""}
          max={to ?? undefined}
          onChange={(event) => onFromChange(event.target.value || null)}
          aria-label="Filtrar desde"
        />
      </label>

      <label className="flex flex-col gap-1 max-md:w-full">
        <span className={FILTER_LABEL}>Hasta</span>
        <input
          type="date"
          className={FILTER_DATE}
          value={to ?? ""}
          min={from ?? undefined}
          onChange={(event) => onToChange(event.target.value || null)}
          aria-label="Filtrar hasta"
        />
      </label>

      <label className="flex flex-col gap-1 max-md:w-full">
        <span className={FILTER_LABEL}>Estado</span>
        <select
          className={FILTER_SELECT}
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as SaleStatusFilter)
          }
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilters ? (
        <button type="button" className={CLEAR_BUTTON} onClick={onClear}>
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
