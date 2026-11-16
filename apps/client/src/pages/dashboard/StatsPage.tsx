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

type BadgeTone = "success" | "danger" | "warning" | "neutral" | "brand";

const BADGE_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";

const BADGE_TONES: Record<BadgeTone, string> = {
  success: "bg-success-soft text-green-700",
  danger: "bg-danger-soft text-red-700",
  warning: "bg-warning-soft text-amber-700",
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-brand-soft text-brand-dark",
};

const badgeClass = (tone: BadgeTone): string =>
  `${BADGE_BASE} ${BADGE_TONES[tone]}`;

const variationTone = (value: number): BadgeTone =>
  value >= 0 ? "success" : "danger";

const variationLabel = (value: number | null): string =>
  value === null ? "Sin período previo" : formatPercent(value);

const variationBadgeTone = (value: number | null): BadgeTone =>
  value === null ? "neutral" : variationTone(value);

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
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <div
          className="inline-flex gap-0.5 rounded-[11px] border border-line bg-white p-1"
          role="group"
          aria-label="Período"
        >
          {PERIODS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`cursor-pointer rounded-lg border-none px-4 py-[7px] text-[13px] font-semibold transition-colors ${
                period === option.id
                  ? "bg-brand text-white"
                  : "bg-transparent text-muted"
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
          className="inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65"
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
              className="inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65"
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
              className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4"
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

            <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5 max-[1100px]:grid-cols-1">
              <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
                <div className="flex items-start justify-between gap-4 px-[22px] pt-5 max-[720px]:px-4">
                  <div>
                    <h2 className="text-[15px] font-bold tracking-[-0.01em]">
                      Ingresos por mes
                    </h2>
                    <p className="mt-[3px] text-[12.5px] text-muted">
                      Evolución de la facturación
                    </p>
                  </div>
                  <span className={badgeClass("brand")}>6 meses</span>
                </div>
                <div className="px-[22px] py-5">
                  {maxRevenue === 0 ? (
                    <p className="mt-[3px] text-[12.5px] text-muted">
                      Todavía no hay ventas completadas para graficar.
                    </p>
                  ) : (
                    <div
                      className="flex h-[210px] items-end gap-4 pt-2"
                      role="img"
                      aria-label="Ingresos por mes"
                    >
                      {data.monthlyRevenue.map((item) => (
                        <div
                          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                          key={item.month}
                        >
                          <div
                            className="w-full max-w-[46px] min-h-1.5 rounded-t-lg rounded-b bg-linear-to-b from-indigo-400 to-indigo-600 transition-opacity hover:opacity-80"
                            style={{
                              height: `${Math.round((Number(item.total) / maxRevenue) * 100)}%`,
                            }}
                            title={formatCurrency(Number(item.total))}
                          />
                          <span className="text-[11.5px] text-muted">
                            {formatMonthLabel(item.month)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
                <div className="flex items-start justify-between gap-4 px-[22px] pt-5 max-[720px]:px-4">
                  <div>
                    <h2 className="text-[15px] font-bold tracking-[-0.01em]">
                      Top productos
                    </h2>
                    <p className="mt-[3px] text-[12.5px] text-muted">
                      Por unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="px-[22px] py-5">
                  {data.topProducts.length === 0 ? (
                    <p className="mt-[3px] text-[12.5px] text-muted">
                      Todavía no hay productos vendidos en el período.
                    </p>
                  ) : (
                    <ul className="m-0 grid list-none gap-4 p-0">
                      {data.topProducts.map((product) => (
                        <li key={product.productId}>
                          <div className="mb-[7px] flex items-center justify-between gap-3 text-[13px]">
                            <span>{product.name}</span>
                            <strong className="text-[12.5px] text-ink-soft">
                              {formatCurrency(Number(product.revenue))}
                            </strong>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
                            <span
                              className="block h-full rounded-full bg-linear-to-r from-indigo-500 to-indigo-400"
                              style={{ width: `${product.share}%` }}
                            />
                          </div>
                          <p className="mt-[5px] text-[11.5px] text-muted">
                            {formatNumber(product.units)} unidades
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
              <div className="flex items-start justify-between gap-4 px-[22px] pt-5 max-[720px]:px-4">
                <div>
                  <h2 className="text-[15px] font-bold tracking-[-0.01em]">
                    Resumen del período
                  </h2>
                  <p className="mt-[3px] text-[12.5px] text-muted">{periodLabel}</p>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-[720px]:px-4">
                        Indicador
                      </th>
                      <th className="whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-[720px]:px-4">
                        Valor
                      </th>
                      <th className="whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-[720px]:px-4">
                        Variación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50">
                    <tr>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-[720px]:px-4">
                        Facturación total
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle font-semibold text-ink max-[720px]:px-4">
                        {formatCurrency(Number(data.totals.revenue))}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-[720px]:px-4">
                        <span
                          className={badgeClass(
                            variationBadgeTone(data.variations.revenuePercent),
                          )}
                        >
                          {variationLabel(data.variations.revenuePercent)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-[720px]:px-4">
                        Ganancia estimada
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle font-semibold text-ink max-[720px]:px-4">
                        {formatCurrency(Number(data.totals.estimatedProfit))}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-[720px]:px-4">
                        <span
                          className={badgeClass(
                            variationBadgeTone(data.variations.profitPercent),
                          )}
                        >
                          {variationLabel(data.variations.profitPercent)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-[720px]:px-4">
                        Ventas anuladas
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle font-semibold text-ink max-[720px]:px-4">
                        {formatCurrency(Number(data.totals.cancelledAmount))}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-[720px]:px-4">
                        <span className={badgeClass("warning")}>
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
