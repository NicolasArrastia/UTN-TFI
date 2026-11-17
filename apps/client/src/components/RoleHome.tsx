import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";

interface RoleHomeProps {
  children: ReactNode;
}

export function RoleHome({ children }: RoleHomeProps) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard/sales" replace />;
  }

  return <>{children}</>;
}
