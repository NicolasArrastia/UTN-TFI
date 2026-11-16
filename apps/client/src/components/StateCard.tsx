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
      className="flex flex-col items-center gap-2.5 px-[22px] py-8 text-center"
      role={tone === "error" ? "alert" : "status"}
    >
      <h3
        className={`text-[15px] font-bold tracking-[-0.01em] ${
          tone === "error" ? "text-danger" : "text-ink"
        }`}
      >
        {title}
      </h3>
      <p className="max-w-[52ch] text-[13.5px] leading-[1.55] text-muted">
        {message}
      </p>
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  );
}
