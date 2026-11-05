import type { ReactNode } from "react";

type StatTone = "brand" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: StatTone;
  icon?: ReactNode;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon ? <span className="stat-card__icon">{icon}</span> : null}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </article>
  );
}
