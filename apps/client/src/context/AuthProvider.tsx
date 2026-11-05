import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context.ts";
import type { AuthStatus } from "./auth-context.ts";
import { ApiError } from "../services/api-client.ts";
import { authService } from "../services/auth.service.ts";
import { notify } from "../services/notifications.ts";
import type { AuthUser } from "../types/auth.types.ts";

const TOKEN_STORAGE_KEY = "utn-tfi.token";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY) ? "checking" : "guest",
  );

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      return;
    }

    let cancelled = false;

    authService
      .getProfile(token)
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setStatus("guest");

        if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
          notify.error(
            "No se pudo validar la sesión: el servidor no está disponible.",
          );
        } else {
          notify.error("Tu sesión expiró. Iniciá sesión nuevamente.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthUser> => {
      const response = await authService.login(username, password);

      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setUser(response.user);
      setStatus("authenticated");

      return response.user;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
