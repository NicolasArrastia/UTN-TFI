import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { StateCard } from "./StateCard.tsx";

interface AdminOnlyProps {
  children: ReactNode;
}

export function AdminOnly({ children }: AdminOnlyProps) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <section className="rounded-card border border-line bg-white shadow-card">
        <StateCard
          title="Acceso restringido"
          message="Solo los administradores pueden crear, editar o dar de baja productos."
          action={
            <Link
              to="/dashboard/products"
              className="inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Volver al listado
            </Link>
          }
        />
      </section>
    );
  }

  return <>{children}</>;
}
