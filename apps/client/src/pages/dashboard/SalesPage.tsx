import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { StateCard } from "../../components/StateCard.tsx";
import { IconPlus } from "../../components/icons.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { authenticatedRequest } from "../../services/api-client.ts";
import { notify } from "../../services/notifications.ts";
import { formatDateTime } from "../../utils/format.ts";
import { paymentMethodLabels, saleStatusLabels } from "../../utils/labels.ts";

const PAGE_SIZE = 10;

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

const FIELD = "flex flex-col gap-[7px]";
const FIELD_LABEL = "text-[13px] font-semibold text-ink-soft";
const FIELD_CONTROL =
  "w-full rounded-field border border-line bg-white px-[13px] py-[11px] text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13 disabled:bg-slate-50 disabled:text-muted aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-[#fff7f7]";

const PAGINATION =
  "flex flex-wrap items-center justify-between gap-3 border-t border-line px-[22px] py-3.5 max-md:px-4";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface SaleSummary {
  id: number;
  number: number;
  userId: number;
  paymentMethod: string;
  total: string;
  status: "completed" | "cancelled";
  createdAt: string;
  cancelledAt: string | null;
  cancelledBy: number | null;
  cancellationReason: string | null;
}

interface SaleDetail extends SaleSummary {
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }[];
}

interface SalesResponse {
  sales: SaleSummary[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

type RequestState<T> =
  | { key: string; data: T }
  | { key: string; error: string };

const saleNumber = (number: number): string =>
  `V-${String(number).padStart(6, "0")}`;

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

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
  const [page, setPage] = useState(1);
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

  const historyKey = `${page}:${refresh}`;
  const detailKey = `${selectedId}:${refresh}`;
  const currentHistory = history?.key === historyKey ? history : null;
  const currentDetail = detail?.key === detailKey ? detail : null;
  const historyData =
    currentHistory && "data" in currentHistory ? currentHistory.data : null;
  const sale =
    currentDetail && "data" in currentDetail ? currentDetail.data : null;

  useEffect(() => {
    const controller = new AbortController();

    authenticatedRequest<SalesResponse>(
      `/sales?page=${page}&limit=${PAGE_SIZE}`,
      {
        signal: controller.signal,
      },
    )
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
  }, [historyKey, page]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    const controller = new AbortController();

    authenticatedRequest<{ sale: SaleDetail }>(`/sales/${selectedId}`, {
      signal: controller.signal,
    })
      .then(({ sale: data }) => {
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
      await authenticatedRequest(`/sales/${sale.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: reason.trim() }),
      });

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
          <StateCard
            title="No hay ventas para mostrar"
            message={
              page === 1
                ? "Las ventas registradas van a aparecer acá."
                : "Volvé a la página anterior para ver más ventas."
            }
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className={TABLE} aria-label="Historial de ventas">
              <thead>
                <tr>
                  <th scope="col" className={TH}>
                    Número
                  </th>
                  <th scope="col" className={TH}>
                    Fecha
                  </th>
                  <th scope="col" className={TH}>
                    Usuario
                  </th>
                  <th scope="col" className={TH}>
                    Total
                  </th>
                  <th scope="col" className={TH}>
                    Pago
                  </th>
                  <th scope="col" className={TH}>
                    Estado
                  </th>
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
                    <td className={TD}>#{entry.userId}</td>
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
        )}

        {historyData && (page > 1 || historyData.pagination.hasNextPage) && (
          <div className={PAGINATION}>
            <p className="text-[12.5px] text-muted">Página {page}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={BTN_GHOST}
                disabled={page <= 1 || isCancelling}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className={BTN_GHOST}
                disabled={!historyData.pagination.hasNextPage || isCancelling}
                onClick={() => setPage((current) => current + 1)}
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
