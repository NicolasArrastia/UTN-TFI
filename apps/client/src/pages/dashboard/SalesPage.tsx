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
  const tone = status === "completed" ? "success" : "danger";

  return (
    <span className={`badge badge--${tone}`}>
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
      <section className="card" aria-labelledby="sales-history-title">
        <div className="card__header card__header--stack">
          <div>
            <h2 id="sales-history-title" className="card__title">
              Historial de ventas
            </h2>
            <p className="card__subtitle">Consultá las ventas registradas.</p>
          </div>

          <Link to="/dashboard/sales/new" className="btn btn--primary btn--sm">
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
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={reload}
              >
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
          <div className="table-wrap">
            <table className="table" aria-label="Historial de ventas">
              <thead>
                <tr>
                  <th scope="col">Número</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Total</th>
                  <th scope="col">Pago</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {currentHistory.data.sales.map((entry) => (
                  <tr key={entry.id}>
                    <td className="cell-strong">{saleNumber(entry.number)}</td>
                    <td>{formatDateTime(entry.createdAt)}</td>
                    <td>#{entry.userId}</td>
                    <td className="cell-strong">
                      {currency.format(Number(entry.total))}
                    </td>
                    <td>
                      {paymentMethodLabels[entry.paymentMethod] ??
                        entry.paymentMethod}
                    </td>
                    <td>
                      <SaleStatusBadge status={entry.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
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
          <div className="pagination">
            <p className="pagination__info">Página {page}</p>
            <div className="pagination__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={page <= 1 || isCancelling}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
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
        <section className="card" aria-labelledby="sale-detail-title">
          <div className="card__header card__header--stack">
            <div>
              <h2 id="sale-detail-title" className="card__title">
                {sale
                  ? `Detalle de ${saleNumber(sale.number)}`
                  : "Detalle de venta"}
              </h2>
              {sale && <SaleStatusBadge status={sale.status} />}
            </div>

            <button
              type="button"
              className="btn btn--ghost btn--sm"
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
            sale && (
              <>
                <div className="table-wrap">
                  <table className="table" aria-label="Productos vendidos">
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Cantidad</th>
                        <th scope="col">Precio unitario</th>
                        <th scope="col">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{currency.format(Number(item.unitPrice))}</td>
                          <td>{currency.format(Number(item.subtotal))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className="card__body"
                  style={{ display: "grid", gap: 16 }}
                >
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
                        style={{ display: "grid", gap: 12, maxWidth: 420 }}
                        onSubmit={(event) => {
                          event.preventDefault();
                          void cancelSale();
                        }}
                      >
                        <div className="field">
                          <label htmlFor="sale-cancellation-reason">
                            Motivo de la anulación
                          </label>
                          <textarea
                            id="sale-cancellation-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            maxLength={500}
                            rows={3}
                            required
                            disabled={isCancelling}
                          />
                        </div>

                        <p className="card__subtitle">
                          Las unidades volverán al stock y la venta quedará en
                          el historial.
                        </p>

                        {cancelError && <p role="alert">{cancelError}</p>}

                        <div className="toolbar">
                          <button
                            type="submit"
                            className="btn btn--danger btn--sm"
                            disabled={!reason.trim() || isCancelling}
                          >
                            {isCancelling
                              ? "Anulando..."
                              : "Confirmar anulación"}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
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
                          className="btn btn--danger btn--sm"
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
