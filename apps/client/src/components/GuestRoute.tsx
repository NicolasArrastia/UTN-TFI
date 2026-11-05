import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { FullScreenLoader } from "./FullScreenLoader.tsx";

export function GuestRoute() {
  const { status } = useAuth();

  if (status === "checking") {
    return <FullScreenLoader />;
  }

  return status === "authenticated" ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Outlet />
  );
}
