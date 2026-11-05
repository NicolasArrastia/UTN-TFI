import { useContext } from "react";
import { AuthContext } from "../context/auth-context.ts";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider.");
  }

  return context;
}
