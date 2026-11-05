import { Link } from "react-router-dom";
import { StatCard } from "../../components/StatCard.tsx";
import {
  IconCart,
  IconTrendUp,
  IconWarning,
  IconBox,
} from "../../components/icons.tsx";
import { formatCurrency, formatNumber } from "../../utils/format.ts";

const salesByMonth = [
  { month: "Jun", total: 980_000 },
  { month: "Jul", total: 1_240_000 },
  { month: "Ago", total: 1_110_000 },
  { month: "Sep", total: 1_520_000 },
  { month: "Oct", total: 1_680_000 },
  { month: "Nov", total: 640_000 },
];

const maxTotal = Math.max(...salesByMonth.map((item) => item.total));

const recentSales = [
  {
    number: "V-000142",
    date: "Hoy · 10:24",
    items: 3,
    total: 18_400,
    method: "cash",
    status: "completed",
  },
  {
    number: "V-000141",
    date: "Hoy · 09:51",
    items: 5,
    total: 32_750,
    method: "card",
    status: "completed",
  },
  {
    number: "V-000140",
    date: "Ayer · 18:12",
    items: 2,
    total: 8_900,
    method: "transfer",
    status: "completed",
  },
  {
    number: "V-000139",
    date: "Ayer · 17:40",
    items: 1,
    total: 4_200,
    method: "cash",
    status: "cancelled",
  },
];

const lowStock = [
  { name: "Yerba mate 1 kg", stock: 8, minStock: 12 },
  { name: "Detergente 750 ml", stock: 0, minStock: 6 },
  { name: "Azúcar 1 kg", stock: 4, minStock: 10 },
];

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};

export function OverviewPage() {
  return (
    <>
      <section className="stat-grid" aria-label="Indicadores principales">
        <StatCard
          label="Ventas del mes"
          value={formatNumber(128)}
          hint="+12% respecto al mes anterior"
          tone="brand"
          icon={<IconCart width={18} height={18} />}
        />
        <StatCard
          label="Facturación"
          value={formatCurrency(1_684_000)}
          hint="Noviembre en curso"
          tone="success"
          icon={<IconTrendUp width={18} height={18} />}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(13_156)}
          hint="Sobre 128 operaciones"
          tone="brand"
          icon={<IconBox width={18} height={18} />}
        />
        <StatCard
          label="Stock bajo"
          value={formatNumber(3)}
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
              <p className="card__subtitle">Últimos seis meses (datos mock)</p>
            </div>
            <span className="badge badge--brand">ARS</span>
          </div>
          <div className="card__body">
            <div className="bar-chart" role="img" aria-label="Facturación por mes">
              {salesByMonth.map((item) => (
                <div className="bar-chart__item" key={item.month}>
                  <div
                    className="bar-chart__bar"
                    style={{
                      height: `${Math.round((item.total / maxTotal) * 100)}%`,
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
              <h2 className="card__title">Reposición sugerida</h2>
              <p className="card__subtitle">Productos por debajo del mínimo</p>
            </div>
          </div>
          <div className="card__body">
            <ul className="alert-list">
              {lowStock.map((item) => (
                <li className="alert-item" key={item.name}>
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
              {recentSales.map((sale) => (
                <tr key={sale.number}>
                  <td className="cell-strong">{sale.number}</td>
                  <td className="cell-muted">{sale.date}</td>
                  <td>{sale.items}</td>
                  <td className="cell-strong">{formatCurrency(sale.total)}</td>
                  <td>
                    <span className="badge badge--neutral">
                      {methodLabels[sale.method]}
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
                      {sale.status === "completed" ? "Completada" : "Anulada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
