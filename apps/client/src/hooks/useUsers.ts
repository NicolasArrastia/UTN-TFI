import { useCallback, useEffect, useState } from "react";
import { getUserErrorMessage } from "../services/notifications.ts";
import { userService } from "../services/user.service.ts";
import type { AuthUser } from "../types/auth.types.ts";

interface UsersState {
  users: AuthUser[];
  requestKey: string | null;
  error: string | null;
}

const INITIAL_STATE: UsersState = {
  users: [],
  requestKey: null,
  error: null,
};

export function useUsers(includeInactive: boolean) {
  const [state, setState] = useState<UsersState>(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  const requestKey = `${includeInactive}#${refreshToken}`;

  useEffect(() => {
    const controller = new AbortController();

    userService
      .list(includeInactive, controller.signal)
      .then((users) => {
        setState({ users, requestKey, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          requestKey,
          error: getUserErrorMessage(error),
        }));
      });

    return () => {
      controller.abort();
    };
  }, [includeInactive, requestKey]);

  const reload = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const isLoading = state.requestKey !== requestKey;

  return {
    users: state.users,
    isLoading,
    error: isLoading ? null : state.error,
    reload,
  };
}
