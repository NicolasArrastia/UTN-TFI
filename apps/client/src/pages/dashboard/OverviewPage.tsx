import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "../../components/StatCard.tsx";
import { StateCard } from "../../components/StateCard.tsx";
import {
  IconCart,
  IconTrendUp,
  IconWarning,
  IconBox,
} from "../../components/icons.tsx";
import { statsService } from "../../services/stats.service.ts";
import { paymentMethodLabels, saleStatusLabels } from "../../utils/labels.ts";
import {
  formatCurrency,
  formatDateTime,
  formatMonthLabel,
  formatNumber,
} from "../../utils/format.ts";
import type { OverviewStats } from "../../types/stats.types.ts";

type OverviewState =
  | { key: string; status: "loading" }
  | { key: string; status: "error"; message: string }
  | { key: string; status: "ready"; data: OverviewStats };

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "No se pudo cargar el panel.";

const saleNumber = (number: number): string =>
  `V-${String(number).padStart(6, "0")}`;

const CARD =
  "overflow-hidden rounded-card border border-line bg-white shadow-card";
const CARD_HEADER = "flex items-start justify-between gap-4 px-[22px] pt-5";
const CARD_TITLE = "text-[15px] font-bold tracking-[-0.01em]";
const CARD_SUBTITLE = "mt-[3px] text-[12.5px] text-muted";
const CARD_BODY = "px-[22px] py-5";

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";
const BADGE_BRAND = `${BADGE} bg-brand-soft text-brand-dark`;
const BADGE_NEUTRAL = `${BADGE} bg-slate-100 text-slate-600`;

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50";

const TH =
  "whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4";
const TD =
  "whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4";

const STATE_ROW =
  "flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted";

const LARGE_SPINNER =
  "size-8 animate-spin rounded-full border-[3px] border-line border-t-brand";

export function OverviewPage() {
  const [state, setState] = useState<OverviewState>({
    key: "",
    status: "loading",
  });
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = String(reloadKey);
  const current = state.key === requestKey ? state : null;

  useEffect(() => {
    const controller = new AbortController();

    statsService
      .getOverview({ signal: controller.signal })
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
  }, [requestKey]);

  if (!current || current.status === "loading") {
    return (
      <section className={CARD} aria-busy="true">
        <div className={STATE_ROW} role="status" aria-live="polite">
          <span className={LARGE_SPINNER} aria-hidden="true" />
          <span>Cargando resumen...</span>
        </div>
      </section>
    );
  }

  if (current.status === "error") {
    return (
      <StateCard
        title="No pudimos cargar el panel"
        message={current.message}
        tone="error"
        action={
          <button
            type="button"
            className={GHOST_BUTTON}
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Reintentar
          </button>
        }
      />
    );
  }

  const { data } = current;
  const maxTotal = Math.max(0, ...data.monthlyRevenue.map((item) => Number(item.total)));

  return (
    <>
      <section
        className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4"
        aria-label="Indicadores principales"
      >
        <StatCard
          label="Ventas del mes"
          value={formatNumber(data.sales.count)}
          hint="Operaciones completadas"
          tone="brand"
          icon={<IconCart width={18} height={18} />}
        />
        <StatCard
          label="Facturación"
          value={formatCurrency(Number(data.sales.revenue))}
          hint="Mes en curso"
          tone="success"
          icon={<IconTrendUp width={18} height={18} />}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(Number(data.sales.averageTicket))}
          hint="Sobre las operaciones del mes"
          tone="brand"
          icon={<IconBox width={18} height={18} />}
        />
        <StatCard
          label="Stock bajo"
          value={formatNumber(data.lowStockCount)}
          hint="Productos que necesitan reposición"
          tone="warning"
          icon={<IconWarning width={18} height={18} />}
        />
      </section>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5 max-[1100px]:grid-cols-1">
        <section className={CARD}>
          <div className={CARD_HEADER}>
            <div>
              <h2 className={CARD_TITLE}>Facturación mensual</h2>
              <p className={CARD_SUBTITLE}>Últimos seis meses</p>
            </div>
            <span className={BADGE_BRAND}>ARS</span>
          </div>
          <div className={CARD_BODY}>
            {maxTotal === 0 ? (
              <p className={CARD_SUBTITLE}>
                Todavía no hay ventas completadas para graficar.
              </p>
            ) : (
              <div
                className="flex h-[210px] items-end gap-4 pt-2"
                role="img"
                aria-label="Facturación por mes"
              >
                {data.monthlyRevenue.map((item) => (
                  <div
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    key={item.month}
                  >
                    <div
                      className="w-full max-w-[46px] min-h-[6px] rounded-t-[8px] rounded-b-[4px] bg-gradient-to-b from-accent-400 to-brand transition-opacity hover:opacity-80"
                      style={{
                        height: `${Math.round((Number(item.total) / maxTotal) * 100)}%`,
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

        <section className={CARD}>
          <div className={CARD_HEADER}>
            <div>
              <h2 className={CARD_TITLE}>Reposición sugerida</h2>
              <p className={CARD_SUBTITLE}>Productos por debajo del mínimo</p>
            </div>
          </div>
          <div className={CARD_BODY}>
            {data.lowStockProducts.length === 0 ? (
              <p className={CARD_SUBTITLE}>
                No hay productos por debajo del stock mínimo.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0">
                {data.lowStockProducts.map((item) => (
                  <li
                    className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3"
                    key={item.id}
                  >
                    <span className="grid size-[30px] flex-none place-items-center rounded-full bg-warning-soft text-amber-700">
                      <IconWarning width={16} height={16} />
                    </span>
                    <div className="flex flex-col gap-0.5 text-[12.5px]">
                      <strong className="text-[13px]">{item.name}</strong>
                      <span className="text-muted">
                        {item.stock} de {item.minStock} unidades mínimas
                      </span>
                    </div>
                    <Link
                      className="ml-auto text-[12.5px] font-semibold text-brand hover:underline"
                      to="/dashboard/products"
                    >
                      Ver
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className={CARD}>
        <div className={CARD_HEADER}>
          <div>
            <h2 className={CARD_TITLE}>Últimas ventas</h2>
            <p className={CARD_SUBTITLE}>Actividad reciente del comercio</p>
          </div>
          <Link className={GHOST_BUTTON} to="/dashboard/sales">
            Ver todas
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          {data.recentSales.length === 0 ? (
            <div className={CARD_BODY}>
              <p className={CARD_SUBTITLE}>
                Las ventas registradas van a aparecer acá.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className={TH}>Número</th>
                  <th className={TH}>Fecha</th>
                  <th className={TH}>Productos</th>
                  <th className={TH}>Total</th>
                  <th className={TH}>Pago</th>
                  <th className={TH}>Estado</th>
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50">
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className={`${TD} font-semibold text-ink`}>
                      {saleNumber(sale.number)}
                    </td>
                    <td className={`${TD} text-[12.5px] text-muted`}>
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className={TD}>{sale.itemCount}</td>
                    <td className={`${TD} font-semibold text-ink`}>
                      {formatCurrency(Number(sale.total))}
                    </td>
                    <td className={TD}>
                      <span className={BADGE_NEUTRAL}>
                        {paymentMethodLabels[sale.paymentMethod] ??
                          sale.paymentMethod}
                      </span>
                    </td>
                    <td className={TD}>
                      <span
                        className={`${BADGE} ${
                          sale.status === "completed"
                            ? "bg-success-soft text-green-700"
                            : "bg-danger-soft text-red-700"
                        }`}
                      >
                        {saleStatusLabels[sale.status] ?? sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
