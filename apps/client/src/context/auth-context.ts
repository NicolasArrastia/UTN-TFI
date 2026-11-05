import { createContext } from "react";
import type { AuthUser } from "../types/auth.types.ts";

export type AuthStatus = "checking" | "authenticated" | "guest";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
