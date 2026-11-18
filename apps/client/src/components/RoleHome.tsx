import type { ReactNode } from "react";
import { EmployeeHomePage } from "../pages/dashboard/EmployeeHomePage.tsx";
import { useAuth } from "../hooks/useAuth.ts";

interface RoleHomeProps {
  children: ReactNode;
}

export function RoleHome({ children }: RoleHomeProps) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <EmployeeHomePage />;
  }

  return <>{children}</>;
}
