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
      <StateCard
        title="Cargando panel"
        message="Consultando los indicadores del comercio."
      />
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
            className="btn btn--ghost btn--sm"
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
      <section className="stat-grid" aria-label="Indicadores principales">
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

      <div className="content-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Facturación mensual</h2>
              <p className="card__subtitle">Últimos seis meses</p>
            </div>
            <span className="badge badge--brand">ARS</span>
          </div>
          <div className="card__body">
            {maxTotal === 0 ? (
              <p className="card__subtitle">
                Todavía no hay ventas completadas para graficar.
              </p>
            ) : (
              <div
                className="bar-chart"
                role="img"
                aria-label="Facturación por mes"
              >
                {data.monthlyRevenue.map((item) => (
                  <div className="bar-chart__item" key={item.month}>
                    <div
                      className="bar-chart__bar"
                      style={{
                        height: `${Math.round((Number(item.total) / maxTotal) * 100)}%`,
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
              <h2 className="card__title">Reposición sugerida</h2>
              <p className="card__subtitle">Productos por debajo del mínimo</p>
            </div>
          </div>
          <div className="card__body">
            {data.lowStockProducts.length === 0 ? (
              <p className="card__subtitle">
                No hay productos por debajo del stock mínimo.
              </p>
            ) : (
              <ul className="alert-list">
                {data.lowStockProducts.map((item) => (
                  <li className="alert-item" key={item.id}>
                    <span className="alert-item__icon">
                      <IconWarning width={16} height={16} />
                    </span>
                    <div className="alert-item__text">
                      <strong>{item.name}</strong>
                      <span>
                        {item.stock} de {item.minStock} unidades mínimas
                      </span>
                    </div>
                    <Link className="alert-item__link" to="/dashboard/products">
                      Ver
                    </Link>
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
            <h2 className="card__title">Últimas ventas</h2>
            <p className="card__subtitle">Actividad reciente del comercio</p>
          </div>
          <Link className="btn btn--ghost btn--sm" to="/dashboard/sales">
            Ver todas
          </Link>
        </div>
        <div className="table-wrap">
          {data.recentSales.length === 0 ? (
            <div className="card__body">
              <p className="card__subtitle">
                Las ventas registradas van a aparecer acá.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="cell-strong">{saleNumber(sale.number)}</td>
                    <td className="cell-muted">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td>{sale.itemCount}</td>
                    <td className="cell-strong">
                      {formatCurrency(Number(sale.total))}
                    </td>
                    <td>
                      <span className="badge badge--neutral">
                        {paymentMethodLabels[sale.paymentMethod] ??
                          sale.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sale.status === "completed"
                            ? "badge--success"
                            : "badge--danger"
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
