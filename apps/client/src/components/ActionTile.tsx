import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";

export type ActionTileTone = "brand" | "neutral" | "warning" | "danger";

interface ActionTileProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  tone?: ActionTileTone;
  highlighted?: boolean;
  comingSoon?: boolean;
  to?: string;
  onClick?: () => void;
}

const BASE =
  "group relative flex flex-col items-start gap-3 rounded-card border border-line bg-white p-5 text-left shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25";

const HIGHLIGHTED = "border-brand/40 ring-1 ring-brand/15";
const COMING_SOON = "opacity-85";

const ICON_TONES: Record<ActionTileTone, string> = {
  brand: "bg-brand-soft text-brand",
  neutral: "bg-slate-100 text-ink-soft",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function ActionTile({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  highlighted = false,
  comingSoon = false,
  to,
  onClick,
}: ActionTileProps) {
  const className = `${BASE}${highlighted ? ` ${HIGHLIGHTED}` : ""}${
    comingSoon ? ` ${COMING_SOON}` : ""
  }`;

  const iconTone =
    highlighted && tone === "brand" ? "bg-brand text-white" : ICON_TONES[tone];

  const content = (
    <>
      {comingSoon ? (
        <span className="absolute right-3 top-3 rounded-full bg-warning-soft px-2.5 py-0.5 text-[11px] font-semibold text-warning">
          Próximamente
        </span>
      ) : null}
      <span
        className={`inline-flex size-11 items-center justify-center rounded-[11px] ${iconTone}`}
      >
        <Icon width={22} height={22} />
      </span>
      <span className="block text-[15px] font-bold tracking-[-0.01em] text-ink">
        {title}
      </span>
      <span className="block text-[12.5px] text-muted">{description}</span>
    </>
  );

  if (to) {
    return (
      <Link className={className} to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}
