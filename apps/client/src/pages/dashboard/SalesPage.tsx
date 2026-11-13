import { Link } from "react-router-dom";
import { IconCart, IconPlus } from "../../components/icons.tsx";
import { StatCard } from "../../components/StatCard.tsx";
import { formatCurrency } from "../../utils/format.ts";
import { paymentMethodLabels, saleStatusLabels } from "../../utils/labels.ts";

const sales = [
  {
    number: "V-000142",
    date: "04/11/2026 10:24",
    customer: "Mostrador",
    items: 3,
    total: 18_400,
    method: "cash",
    status: "completed",
  },
  {
    number: "V-000141",
    date: "04/11/2026 09:51",
    customer: "María López",
    items: 5,
    total: 32_750,
    method: "card",
    status: "completed",
  },
  {
    number: "V-000140",
    date: "03/11/2026 18:12",
    customer: "Mostrador",
    items: 2,
    total: 8_900,
    method: "transfer",
    status: "completed",
  },
  {
    number: "V-000139",
    date: "03/11/2026 17:40",
    customer: "Jorge Díaz",
    items: 1,
    total: 4_200,
    method: "cash",
    status: "cancelled",
  },
  {
    number: "V-000138",
    date: "03/11/2026 12:05",
    customer: "Mostrador",
    items: 4,
    total: 26_100,
    method: "cash",
    status: "completed",
  },
];

export function SalesPage() {
  return (
    <>
      <section className="stat-grid" aria-label="Indicadores de ventas">
        <StatCard
          label="Ventas del mes"
          value="128"
          hint="6 completadas hoy"
          tone="brand"
          icon={<IconCart width={18} height={18} />}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(13_156)}
          hint="+4% vs. octubre"
          tone="success"
        />
        <StatCard
          label="Efectivo"
          value="52%"
          hint="Principal medio de pago"
          tone="brand"
        />
        <StatCard label="Anuladas" value="2" hint="Este mes" tone="danger" />
      </section>

      <section className="card">
        <div className="card__header card__header--stack">
          <div>
            <h2 className="card__title">Historial de ventas</h2>
            <p className="card__subtitle">
              Operaciones registradas · datos de ejemplo
            </p>
          </div>

          <Link to="/dashboard/sales/new" className="btn btn--primary btn--sm">
            <IconPlus width={16} height={16} />
            Registrar venta
          </Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.number}>
                  <td className="cell-strong">{sale.number}</td>
                  <td className="cell-muted">{sale.date}</td>
                  <td>{sale.customer}</td>
                  <td>{sale.items}</td>
                  <td className="cell-strong">{formatCurrency(sale.total)}</td>
                  <td>
                    <span className="badge badge--neutral">
                      {paymentMethodLabels[sale.method]}
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
                      {saleStatusLabels[sale.status]}
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
