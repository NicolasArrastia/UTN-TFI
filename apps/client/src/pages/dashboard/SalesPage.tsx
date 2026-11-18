import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SortableHeader } from "../../components/SortableHeader.tsx";
import { StateCard } from "../../components/StateCard.tsx";
import { IconPlus } from "../../components/icons.tsx";
import { SalesFilters } from "../../components/sales/SalesFilters.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { notify } from "../../services/notifications.ts";
import { saleService } from "../../services/sale.service.ts";
import {
  SALE_SORT_FIELDS,
  type SaleDetail,
  type SaleListParams,
  type SaleSortBy,
  type SaleStatusFilter,
  type SalesResponse,
  type SaleSummary,
} from "../../types/sale.types.ts";
import type { SortDir } from "../../types/sort.types.ts";
import { formatCurrency, formatDateTime } from "../../utils/format.ts";
import { paymentMethodLabels, saleStatusLabels } from "../../utils/labels.ts";

const PAGE_SIZE = 10;
const DEFAULT_SORT_BY: SaleSortBy = "createdAt";
const DEFAULT_SORT_DIR: SortDir = "desc";

const CARD =
  "overflow-hidden rounded-card border border-line bg-white shadow-card";
const CARD_HEADER =
  "flex flex-wrap items-start justify-between gap-4 px-[22px] pt-5 pb-1";
const CARD_TITLE = "text-[15px] font-bold tracking-[-0.01em]";
const CARD_SUBTITLE = "mt-[3px] text-[12.5px] text-muted";
const CARD_BODY = "px-[22px] py-5";

const BTN =
  "inline-flex items-center justify-center gap-2 rounded-field px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-65";
const BTN_PRIMARY = `${BTN} bg-brand text-white hover:bg-brand-dark`;
const BTN_GHOST = `${BTN} border border-line text-ink-soft hover:border-slate-300 hover:bg-slate-50`;
const BTN_DANGER = `${BTN} bg-danger text-white hover:bg-red-700`;

const TABLE = "w-full border-collapse text-[13.5px]";
const TH =
  "whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4";
const TD =
  "whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4";
const TBODY = "[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50";

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";

const SUMMARY =
  "mx-[22px] mt-4 rounded-field border border-line bg-slate-50 px-4 py-3 text-[13px] text-ink-soft max-md:mx-4";

const FIELD = "flex flex-col gap-[7px]";
const FIELD_LABEL = "text-[13px] font-semibold text-ink-soft";
const FIELD_CONTROL =
  "w-full rounded-field border border-line bg-white px-[13px] py-[11px] text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13 disabled:bg-slate-50 disabled:text-muted aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-[#fff7f7]";

const PAGINATION =
  "flex flex-wrap items-center justify-between gap-3 border-t border-line px-[22px] py-3.5 max-md:px-4";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type RequestState<T> =
  | { key: string; data: T }
  | { key: string; error: string };

const saleNumber = (number: number): string =>
  `V-${String(number).padStart(6, "0")}`;

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const parsePage = (value: string | null): number => {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const parsePositiveId = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseDate = (value: string | null): string | null =>
  value !== null && DATE_PATTERN.test(value) ? value : null;

const parseSortBy = (value: string | null): SaleSortBy => {
  if (value !== null && SALE_SORT_FIELDS.includes(value as SaleSortBy)) {
    return value as SaleSortBy;
  }

  return DEFAULT_SORT_BY;
};

const parseSortDir = (value: string | null): SortDir => {
  if (value === "asc" || value === "desc") {
    return value;
  }

  return DEFAULT_SORT_DIR;
};

const parseStatus = (value: string | null): SaleStatusFilter => {
  if (value === "completed" || value === "cancelled") {
    return value;
  }

  return "all";
};

function SaleStatusBadge({ status }: { status: SaleSummary["status"] }) {
  const tone =
    status === "completed"
      ? "bg-success-soft text-green-700"
      : "bg-danger-soft text-red-700";

  return (
    <span className={`${BADGE} ${tone}`}>
      {saleStatusLabels[status] ?? status}
    </span>
  );
}

export function SalesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.role === "admin";
  const page = parsePage(searchParams.get("page"));
  const sortBy = parseSortBy(searchParams.get("sortBy"));
  const sortDir = parseSortDir(searchParams.get("sortDir"));
  const userId = parsePositiveId(searchParams.get("userId"));
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const status = parseStatus(searchParams.get("status"));

  const effectiveUserId = isAdmin ? userId : null;
  const hasActiveFilters =
    effectiveUserId !== null || from !== null || to !== null || status !== "all";

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [history, setHistory] = useState<RequestState<SalesResponse> | null>(
    null,
  );
  const [detail, setDetail] = useState<RequestState<SaleDetail> | null>(null);
  const [isShowingCancellation, setIsShowingCancellation] = useState(false);
  const [reason, setReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const cancelling = useRef(false);

  const params = useMemo<SaleListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortDir,
      userId: effectiveUserId ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, sortBy, sortDir, effectiveUserId, from, to, status],
  );

  const paramsKey = JSON.stringify(params);
  const historyKey = `${paramsKey}:${refresh}`;
  const detailKey = `${selectedId}:${refresh}`;
  const currentHistory = history?.key === historyKey ? history : null;
  const currentDetail = detail?.key === detailKey ? detail : null;
  const historyData =
    currentHistory && "data" in currentHistory ? currentHistory.data : null;
  const sale =
    currentDetail && "data" in currentDetail ? currentDetail.data : null;

  useEffect(() => {
    const controller = new AbortController();
    const requestParams = JSON.parse(paramsKey) as SaleListParams;

    saleService
      .list(requestParams, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setHistory({ key: historyKey, data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setHistory({
            key: historyKey,
            error: errorMessage(error, "No se pudo cargar el historial."),
          });
        }
      });

    return () => controller.abort();
  }, [paramsKey, historyKey]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    const controller = new AbortController();

    saleService
      .getById(selectedId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setDetail({ key: detailKey, data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setDetail({
            key: detailKey,
            error: errorMessage(error, "No se pudo cargar el detalle."),
          });
        }
      });

    return () => controller.abort();
  }, [detailKey, selectedId]);

  const reload = () => setRefresh((current) => current + 1);

  const applyFilters = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (!("page" in changes)) {
      next.delete("page");
    }

    setSearchParams(next, { replace: true });
  };

  const handleUserChange = (nextUserId: number | null) => {
    applyFilters({ userId: nextUserId === null ? null : String(nextUserId) });
  };

  const handleFromChange = (value: string | null) => {
    applyFilters({ from: value });
  };

  const handleToChange = (value: string | null) => {
    applyFilters({ to: value });
  };

  const handleStatusChange = (nextStatus: SaleStatusFilter) => {
    applyFilters({ status: nextStatus === "all" ? null : nextStatus });
  };

  const handleSortChange = (
    nextSortBy: SaleSortBy,
    nextSortDir: SortDir,
  ) => {
    applyFilters({
      sortBy: nextSortBy === DEFAULT_SORT_BY ? null : nextSortBy,
      sortDir: nextSortDir === DEFAULT_SORT_DIR ? null : nextSortDir,
    });
  };

  const handlePageChange = (nextPage: number) => {
    applyFilters({ page: nextPage <= 1 ? null : String(nextPage) });
  };

  const clearFilters = () => {
    applyFilters({ userId: null, from: null, to: null, status: null });
  };

  const selectSale = (id: number | null) => {
    setSelectedId(id);
    setIsShowingCancellation(false);
    setReason("");
    setCancelError(null);
  };

  const cancelSale = async () => {
    if (
      cancelling.current ||
      user?.role !== "admin" ||
      !sale ||
      sale.status !== "completed" ||
      !reason.trim()
    ) {
      return;
    }

    cancelling.current = true;
    setIsCancelling(true);
    setCancelError(null);

    try {
      await saleService.cancel(sale.id, reason.trim());

      setIsShowingCancellation(false);
      setReason("");
      reload();
      notify.success(`Venta ${saleNumber(sale.number)} anulada.`);
    } catch (error) {
      setCancelError(errorMessage(error, "No se pudo anular la venta."));
    } finally {
      cancelling.current = false;
      setIsCancelling(false);
    }
  };

  return (
    <>
      <section className={CARD} aria-labelledby="sales-history-title">
        <div className={CARD_HEADER}>
          <div>
            <h2 id="sales-history-title" className={CARD_TITLE}>
              Historial de ventas
            </h2>
            <p className={CARD_SUBTITLE}>Consultá las ventas registradas.</p>
          </div>

          <Link to="/dashboard/sales/new" className={BTN_PRIMARY}>
            <IconPlus width={16} height={16} />
            Registrar venta
          </Link>
        </div>

        <SalesFilters
          isAdmin={isAdmin}
          userId={effectiveUserId}
          onUserChange={handleUserChange}
          from={from}
          to={to}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          status={status}
          onStatusChange={handleStatusChange}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />

        {!currentHistory ? (
          <StateCard
            title="Cargando ventas"
            message="Consultando el historial."
          />
        ) : "error" in currentHistory ? (
          <StateCard
            title="No pudimos cargar las ventas"
            message={currentHistory.error}
            tone="error"
            action={
              <button type="button" className={BTN_GHOST} onClick={reload}>
                Reintentar
              </button>
            }
          />
        ) : currentHistory.data.sales.length === 0 ? (
          hasActiveFilters ? (
            <StateCard
              title="No hay ventas para los filtros seleccionados"
              message="Probá con otro rango de fechas, estado o empleado."
              action={
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </button>
              }
            />
          ) : (
            <StateCard
              title="No hay ventas para mostrar"
              message={
                page === 1
                  ? "Las ventas registradas van a aparecer acá."
                  : "Volvé a la página anterior para ver más ventas."
              }
            />
          )
        ) : (
          <>
            {hasActiveFilters ? (
              <div className={SUMMARY}>
                <strong>
                  {currentHistory.data.summary.completedCount} ventas completadas
                </strong>
                {" · "}
                {formatCurrency(
                  Number(currentHistory.data.summary.completedTotal),
                )}
                {" · "}
                {currentHistory.data.summary.cancelledCount} anuladas
              </div>
            ) : null}

            <div className="mt-4 overflow-x-auto">
              <table className={TABLE} aria-label="Historial de ventas">
                <thead>
                  <tr>
                    <SortableHeader<SaleSortBy>
                      label="Número"
                      column="number"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      defaultDir="desc"
                      onSortChange={handleSortChange}
                    />
                    <SortableHeader<SaleSortBy>
                      label="Fecha"
                      column="createdAt"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      defaultDir="desc"
                      onSortChange={handleSortChange}
                    />
                    <SortableHeader<SaleSortBy>
                      label="Usuario"
                      column="user"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSortChange={handleSortChange}
                    />
                    <SortableHeader<SaleSortBy>
                      label="Total"
                      column="total"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      defaultDir="desc"
                      onSortChange={handleSortChange}
                    />
                    <SortableHeader<SaleSortBy>
                      label="Pago"
                      column="paymentMethod"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSortChange={handleSortChange}
                    />
                    <SortableHeader<SaleSortBy>
                      label="Estado"
                      column="status"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSortChange={handleSortChange}
                    />
                    <th scope="col" className={TH}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {currentHistory.data.sales.map((entry) => (
                    <tr key={entry.id}>
                      <td className={`${TD} font-semibold text-ink`}>
                        {saleNumber(entry.number)}
                      </td>
                      <td className={TD}>{formatDateTime(entry.createdAt)}</td>
                      <td className={TD}>
                        {entry.userName ?? `#${entry.userId}`}
                      </td>
                      <td className={`${TD} font-semibold text-ink`}>
                        {currency.format(Number(entry.total))}
                      </td>
                      <td className={TD}>
                        {paymentMethodLabels[entry.paymentMethod] ??
                          entry.paymentMethod}
                      </td>
                      <td className={TD}>
                        <SaleStatusBadge status={entry.status} />
                      </td>
                      <td className={TD}>
                        <button
                          type="button"
                          className={BTN_GHOST}
                          aria-label={`Ver detalle de ${saleNumber(entry.number)}`}
                          disabled={isCancelling}
                          onClick={() => selectSale(entry.id)}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {historyData && (page > 1 || historyData.pagination.hasNextPage) && (
          <div className={PAGINATION}>
            <p className="text-[12.5px] text-muted">Página {page}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={BTN_GHOST}
                disabled={page <= 1 || isCancelling}
                onClick={() => handlePageChange(page - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className={BTN_GHOST}
                disabled={!historyData.pagination.hasNextPage || isCancelling}
                onClick={() => handlePageChange(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedId !== null && (
        <section className={CARD} aria-labelledby="sale-detail-title">
          <div className={CARD_HEADER}>
            <div className="flex flex-col items-start">
              <h2 id="sale-detail-title" className={CARD_TITLE}>
                {sale
                  ? `Detalle de ${saleNumber(sale.number)}`
                  : "Detalle de venta"}
              </h2>
              {sale && <SaleStatusBadge status={sale.status} />}
            </div>

            <button
              type="button"
              className={BTN_GHOST}
              disabled={isCancelling}
              onClick={() => selectSale(null)}
            >
              Cerrar detalle
            </button>
          </div>

          {!currentDetail ? (
            <StateCard
              title="Cargando detalle"
              message="Consultando la venta."
            />
          ) : "error" in currentDetail ? (
            <StateCard
              title="No pudimos cargar el detalle"
              message={currentDetail.error}
              tone="error"
              action={
                <button type="button" className={BTN_GHOST} onClick={reload}>
                  Reintentar
                </button>
              }
            />
          ) : (
            sale && (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className={TABLE} aria-label="Productos vendidos">
                    <thead>
                      <tr>
                        <th scope="col" className={TH}>
                          Producto
                        </th>
                        <th scope="col" className={TH}>
                          Cantidad
                        </th>
                        <th scope="col" className={TH}>
                          Precio unitario
                        </th>
                        <th scope="col" className={TH}>
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className={TBODY}>
                      {sale.items.map((item) => (
                        <tr key={item.productId}>
                          <td className={TD}>{item.productName}</td>
                          <td className={TD}>{item.quantity}</td>
                          <td className={TD}>
                            {currency.format(Number(item.unitPrice))}
                          </td>
                          <td className={TD}>
                            {currency.format(Number(item.subtotal))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`${CARD_BODY} grid gap-4`}>
                  <p>
                    <strong>Total {currency.format(Number(sale.total))}</strong>
                  </p>

                  {sale.status === "cancelled" && (
                    <div>
                      {sale.cancelledAt && (
                        <p>Anulada el {formatDateTime(sale.cancelledAt)}</p>
                      )}
                      {sale.cancelledBy !== null && (
                        <p>Usuario que anuló: #{sale.cancelledBy}</p>
                      )}
                      {sale.cancellationReason && (
                        <p>Motivo: {sale.cancellationReason}</p>
                      )}
                    </div>
                  )}

                  {user?.role === "admin" &&
                    sale.status === "completed" &&
                    (isShowingCancellation ? (
                      <form
                        className="grid max-w-[420px] gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void cancelSale();
                        }}
                      >
                        <div className={FIELD}>
                          <label
                            htmlFor="sale-cancellation-reason"
                            className={FIELD_LABEL}
                          >
                            Motivo de la anulación
                          </label>
                          <textarea
                            id="sale-cancellation-reason"
                            className={FIELD_CONTROL}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            maxLength={500}
                            rows={3}
                            required
                            disabled={isCancelling}
                          />
                        </div>

                        <p className={CARD_SUBTITLE}>
                          Las unidades volverán al stock y la venta quedará en
                          el historial.
                        </p>

                        {cancelError && <p role="alert">{cancelError}</p>}

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="submit"
                            className={BTN_DANGER}
                            disabled={!reason.trim() || isCancelling}
                          >
                            {isCancelling
                              ? "Anulando..."
                              : "Confirmar anulación"}
                          </button>
                          <button
                            type="button"
                            className={BTN_GHOST}
                            disabled={isCancelling}
                            onClick={() => selectSale(sale.id)}
                          >
                            Volver
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <button
                          type="button"
                          className={BTN_DANGER}
                          onClick={() => setIsShowingCancellation(true)}
                        >
                          Anular venta
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )
          )}
        </section>
      )}
    </>
  );
}
