import { useEffect, useState } from "react";
import { IconDownload, IconTrendUp } from "../../components/icons.tsx";
import { StatCard } from "../../components/StatCard.tsx";
import { StateCard } from "../../components/StateCard.tsx";
import { notify } from "../../services/notifications.ts";
import { statsService } from "../../services/stats.service.ts";
import {
  formatCurrency,
  formatMonthLabel,
  formatNumber,
} from "../../utils/format.ts";
import type { StatsPeriod, StatsResponse } from "../../types/stats.types.ts";

const PERIODS: Array<{ id: StatsPeriod; label: string }> = [
  { id: "month", label: "Mes" },
  { id: "quarter", label: "Trimestre" },
  { id: "year", label: "Año" },
];

type StatsState =
  | { key: string; status: "loading" }
  | { key: string; status: "error"; message: string }
  | { key: string; status: "ready"; data: StatsResponse };

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "No se pudieron cargar las estadísticas.";

const formatPercent = (value: number): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const variationTone = (value: number): string =>
  value >= 0 ? "badge--success" : "badge--danger";

const variationLabel = (value: number | null): string =>
  value === null ? "Sin período previo" : formatPercent(value);

const variationBadgeTone = (value: number | null): string =>
  value === null ? "badge--neutral" : variationTone(value);

export function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>("month");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<StatsState>({
    key: "",
    status: "loading",
  });

  const requestKey = `${period}:${reloadKey}`;
  const current = state.key === requestKey ? state : null;

  useEffect(() => {
    const controller = new AbortController();

    statsService
      .getStats(period, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ key: requestKey, status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            status: "error",
            message: errorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [period, requestKey]);

  const handleExport = () => {
    notify.info("La exportación de reportes estará disponible pronto.");
  };

  const periodLabel =
    PERIODS.find((option) => option.id === period)?.label ?? "";

  const data = current?.status === "ready" ? current.data : null;
  const maxRevenue = data
    ? Math.max(0, ...data.monthlyRevenue.map((item) => Number(item.total)))
    : 0;

  return (
    <>
      <div className="toolbar toolbar--end">
        <div className="segmented" role="group" aria-label="Período">
          {PERIODS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`segmented__item${
                period === option.id ? " is-active" : ""
              }`}
              onClick={() => setPeriod(option.id)}
              aria-pressed={period === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleExport}
        >
          <IconDownload width={16} height={16} />
          Exportar
        </button>
      </div>

      {!current || current.status === "loading" ? (
        <StateCard
          title="Cargando estadísticas"
          message="Consultando las ventas del período."
        />
      ) : current.status === "error" ? (
        <StateCard
          title="No pudimos cargar las estadísticas"
          message={current.message}
          tone="error"
          action={
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Reintentar
            </button>
          }
        />
      ) : (
        data && (
          <>
            <section
              className="stat-grid"
              aria-label="Indicadores estadísticos"
            >
              <StatCard
                label="Facturación"
                value={formatCurrency(Number(data.totals.revenue))}
                hint={`Período: ${periodLabel}`}
                tone="success"
                icon={<IconTrendUp width={18} height={18} />}
              />
              <StatCard
                label="Operaciones"
                value={formatNumber(data.totals.operations)}
                hint={`Ticket promedio ${formatCurrency(Number(data.totals.averageTicket))}`}
                tone="brand"
              />
              <StatCard
                label="Producto más vendido"
                value={data.topProduct?.name ?? "Sin ventas"}
                hint={
                  data.topProduct
                    ? `${formatNumber(data.topProduct.units)} unidades`
                    : "Todavía no hay ventas en el período"
                }
                tone="brand"
              />
              <StatCard
                label="Mayor rentabilidad"
                value={data.bestMarginProduct?.name ?? "Sin datos"}
                hint={
                  data.bestMarginProduct
                    ? `Margen estimado ${data.bestMarginProduct.marginPercent.toFixed(1)}%`
                    : "Todavía no hay datos de ganancia"
                }
                tone="success"
              />
            </section>

            <div className="content-grid">
              <section className="card">
                <div className="card__header">
                  <div>
                    <h2 className="card__title">Ingresos por mes</h2>
                    <p className="card__subtitle">
                      Evolución de la facturación
                    </p>
                  </div>
                  <span className="badge badge--brand">6 meses</span>
                </div>
                <div className="card__body">
                  {maxRevenue === 0 ? (
                    <p className="card__subtitle">
                      Todavía no hay ventas completadas para graficar.
                    </p>
                  ) : (
                    <div
                      className="bar-chart"
                      role="img"
                      aria-label="Ingresos por mes"
                    >
                      {data.monthlyRevenue.map((item) => (
                        <div className="bar-chart__item" key={item.month}>
                          <div
                            className="bar-chart__bar"
                            style={{
                              height: `${Math.round((Number(item.total) / maxRevenue) * 100)}%`,
                            }}
                            title={formatCurrency(Number(item.total))}
                          />
                          <span className="bar-chart__label">
                            {formatMonthLabel(item.month)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card__header">
                  <div>
                    <h2 className="card__title">Top productos</h2>
                    <p className="card__subtitle">Por unidades vendidas</p>
                  </div>
                </div>
                <div className="card__body">
                  {data.topProducts.length === 0 ? (
                    <p className="card__subtitle">
                      Todavía no hay productos vendidos en el período.
                    </p>
                  ) : (
                    <ul className="rank-list">
                      {data.topProducts.map((product) => (
                        <li key={product.productId}>
                          <div className="rank-item__top">
                            <span>{product.name}</span>
                            <strong>
                              {formatCurrency(Number(product.revenue))}
                            </strong>
                          </div>
                          <div className="rank-bar">
                            <span style={{ width: `${product.share}%` }} />
                          </div>
                          <p className="rank-item__meta">
                            {formatNumber(product.units)} unidades
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <section className="card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Resumen del período</h2>
                  <p className="card__subtitle">{periodLabel}</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Valor</th>
                      <th>Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Facturación total</td>
                      <td className="cell-strong">
                        {formatCurrency(Number(data.totals.revenue))}
                      </td>
                      <td>
                        <span
                          className={`badge ${variationBadgeTone(
                            data.variations.revenuePercent,
                          )}`}
                        >
                          {variationLabel(data.variations.revenuePercent)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Ganancia estimada</td>
                      <td className="cell-strong">
                        {formatCurrency(Number(data.totals.estimatedProfit))}
                      </td>
                      <td>
                        <span
                          className={`badge ${variationBadgeTone(
                            data.variations.profitPercent,
                          )}`}
                        >
                          {variationLabel(data.variations.profitPercent)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Ventas anuladas</td>
                      <td className="cell-strong">
                        {formatCurrency(Number(data.totals.cancelledAmount))}
                      </td>
                      <td>
                        <span className="badge badge--warning">
                          {data.variations.cancellationRate.toFixed(1)}% de las
                          operaciones
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )
      )}
    </>
  );
}
