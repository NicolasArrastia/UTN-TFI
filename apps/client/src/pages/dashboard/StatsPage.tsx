import { useState } from "react";
import { IconDownload, IconTrendUp } from "../../components/icons.tsx";
import { StatCard } from "../../components/StatCard.tsx";
import { notify } from "../../services/notifications.ts";
import { formatCurrency, formatNumber } from "../../utils/format.ts";

const PERIODS = [
  { id: "mes", label: "Mes" },
  { id: "trimestre", label: "Trimestre" },
  { id: "anio", label: "Año" },
];

const revenueByMonth = [
  { month: "Jun", total: 980_000 },
  { month: "Jul", total: 1_240_000 },
  { month: "Ago", total: 1_110_000 },
  { month: "Sep", total: 1_520_000 },
  { month: "Oct", total: 1_680_000 },
  { month: "Nov", total: 640_000 },
];

const maxRevenue = Math.max(...revenueByMonth.map((item) => item.total));

const topProducts = [
  { name: "Café molido 500 g", units: 148, revenue: 621_600, share: 100 },
  { name: "Yerba mate 1 kg", units: 96, revenue: 624_000, share: 78 },
  { name: "Agua mineral 2 L", units: 84, revenue: 159_600, share: 62 },
  { name: "Pan lactal integral", units: 61, revenue: 170_800, share: 48 },
];

export function StatsPage() {
  const [period, setPeriod] = useState("mes");

  const handleExport = () => {
    notify.info("La exportación de reportes estará disponible pronto.");
  };

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

      <section className="stat-grid" aria-label="Indicadores estadísticos">
        <StatCard
          label="Facturación"
          value={formatCurrency(1_684_000)}
          hint="Período seleccionado"
          tone="success"
          icon={<IconTrendUp width={18} height={18} />}
        />
        <StatCard
          label="Operaciones"
          value={formatNumber(128)}
          hint="Ticket promedio $13.156"
          tone="brand"
        />
        <StatCard
          label="Producto más vendido"
          value="Café 500 g"
          hint="148 unidades"
          tone="brand"
        />
        <StatCard
          label="Mayor rentabilidad"
          value="Yerba 1 kg"
          hint="Margen estimado 38%"
          tone="success"
        />
      </section>

      <div className="content-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Ingresos por mes</h2>
              <p className="card__subtitle">Evolución de la facturación</p>
            </div>
            <span className="badge badge--brand">6 meses</span>
          </div>
          <div className="card__body">
            <div className="bar-chart" role="img" aria-label="Ingresos por mes">
              {revenueByMonth.map((item) => (
                <div className="bar-chart__item" key={item.month}>
                  <div
                    className="bar-chart__bar"
                    style={{
                      height: `${Math.round((item.total / maxRevenue) * 100)}%`,
                    }}
                    title={formatCurrency(item.total)}
                  />
                  <span className="bar-chart__label">{item.month}</span>
                </div>
              ))}
            </div>
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
            <ul className="rank-list">
              {topProducts.map((product) => (
                <li key={product.name}>
                  <div className="rank-item__top">
                    <span>{product.name}</span>
                    <strong>{formatCurrency(product.revenue)}</strong>
                  </div>
                  <div className="rank-bar">
                    <span style={{ width: `${product.share}%` }} />
                  </div>
                  <p className="rank-item__meta">{product.units} unidades</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Resumen del período</h2>
            <p className="card__subtitle">
              Datos mock · {PERIODS.find((option) => option.id === period)?.label}
            </p>
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
                <td className="cell-strong">{formatCurrency(1_684_000)}</td>
                <td>
                  <span className="badge badge--success">+12%</span>
                </td>
              </tr>
              <tr>
                <td>Ganancia estimada</td>
                <td className="cell-strong">{formatCurrency(412_000)}</td>
                <td>
                  <span className="badge badge--success">+8%</span>
                </td>
              </tr>
              <tr>
                <td>Ventas anuladas</td>
                <td className="cell-strong">{formatCurrency(4_200)}</td>
                <td>
                  <span className="badge badge--warning">0,2%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
