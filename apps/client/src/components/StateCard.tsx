import type { ReactNode } from "react";

interface StateCardProps {
  title: string;
  message: string;
  tone?: "error" | "neutral";
  action?: ReactNode;
}

export function StateCard({
  title,
  message,
  tone = "neutral",
  action,
}: StateCardProps) {
  return (
    <div
      className={`state-card${tone === "error" ? " state-card--error" : ""}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <h3 className="state-card__title">{title}</h3>
      <p className="state-card__message">{message}</p>
      {action ? <div className="state-card__action">{action}</div> : null}
    </div>
  );
}
