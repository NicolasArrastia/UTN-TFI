import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { StateCard } from "./StateCard.tsx";

interface AdminOnlyProps {
  children: ReactNode;
  message?: string;
  backTo?: string;
  backLabel?: string;
}

export function AdminOnly({
  children,
  message = "Solo los administradores pueden crear, editar o dar de baja productos.",
  backTo = "/dashboard/products",
  backLabel = "Volver al listado",
}: AdminOnlyProps) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <section className="rounded-card border border-line bg-white shadow-card">
        <StateCard
          title="Acceso restringido"
          message={message}
          action={
            <Link
              to={backTo}
              className="inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {backLabel}
            </Link>
          }
        />
      </section>
    );
  }

  return <>{children}</>;
}
