import { useCallback, useEffect, useState } from "react";
import { getCategoryErrorMessage } from "../services/notifications.ts";
import { categoryService } from "../services/category.service.ts";
import type { Category } from "../types/catalog.types.ts";

interface CategoriesState {
  categories: Category[];
  requestKey: string | null;
  error: string | null;
}

const INITIAL_STATE: CategoriesState = {
  categories: [],
  requestKey: null,
  error: null,
};

export function useCategories(includeInactive: boolean) {
  const [state, setState] = useState<CategoriesState>(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  const requestKey = `${includeInactive}#${refreshToken}`;

  useEffect(() => {
    const controller = new AbortController();

    categoryService
      .list(includeInactive, controller.signal)
      .then((categories) => {
        setState({ categories, requestKey, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          requestKey,
          error: getCategoryErrorMessage(error),
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
    categories: state.categories,
    isLoading,
    error: isLoading ? null : state.error,
    reload,
  };
}
