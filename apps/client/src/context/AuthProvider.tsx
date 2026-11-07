import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context.ts";
import type { AuthStatus } from "./auth-context.ts";
import { ApiError } from "../services/api-client.ts";
import { authService } from "../services/auth.service.ts";
import { notify } from "../services/notifications.ts";
import { tokenStorage } from "../services/token-storage.ts";
import type { AuthUser } from "../types/auth.types.ts";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? "checking" : "guest",
  );

  useEffect(() => {
    const token = tokenStorage.get();

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

        tokenStorage.clear();
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

      tokenStorage.set(response.token);
      setUser(response.user);
      setStatus("authenticated");

      return response.user;
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
