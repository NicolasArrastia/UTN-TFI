import type { ReactNode } from "react";

type StatTone = "brand" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: StatTone;
  icon?: ReactNode;
}

const ICON_TONES: Record<StatTone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-green-700",
  warning: "bg-warning-soft text-amber-700",
  danger: "bg-danger-soft text-red-700",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: StatCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-card border border-line bg-white px-5 py-[18px] shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] font-bold uppercase tracking-[0.05em] text-muted">
          {label}
        </span>
        {icon ? (
          <span
            className={`grid size-[34px] place-items-center rounded-field ${ICON_TONES[tone]}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <strong className="text-[23px] font-bold tracking-[-0.02em]">{value}</strong>
      {hint ? <span className="text-[12.5px] text-muted">{hint}</span> : null}
    </article>
  );
}
