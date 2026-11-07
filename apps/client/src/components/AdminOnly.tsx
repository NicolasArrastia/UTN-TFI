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
      <section className="card">
        <StateCard
          title="Acceso restringido"
          message="Solo los administradores pueden crear, editar o dar de baja productos."
          action={
            <Link to="/dashboard/products" className="btn btn--ghost btn--sm">
              Volver al listado
            </Link>
          }
        />
      </section>
    );
  }

  return <>{children}</>;
}
