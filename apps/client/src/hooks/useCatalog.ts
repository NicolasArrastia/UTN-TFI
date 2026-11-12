import { useCallback, useEffect, useState } from "react";
import {
  CATALOG_CHANGED_EVENT,
  catalogService,
} from "../services/catalog.service.ts";
import { getProductErrorMessage } from "../services/notifications.ts";
import type { Category, Tag } from "../types/catalog.types.ts";

interface CatalogState {
  categories: Category[];
  tags: Tag[];
  requestKey: number | null;
  error: string | null;
}

const INITIAL_STATE: CatalogState = {
  categories: [],
  tags: [],
  requestKey: null,
  error: null,
};

export function useCatalog() {
  const [state, setState] = useState<CatalogState>(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([catalogService.listCategories(), catalogService.listTags()])
      .then(([categories, tags]) => {
        if (cancelled) {
          return;
        }

        setState({ categories, tags, requestKey: refreshToken, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          ...current,
          requestKey: refreshToken,
          error: getProductErrorMessage(error),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const reload = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    window.addEventListener(CATALOG_CHANGED_EVENT, reload);

    return () => {
      window.removeEventListener(CATALOG_CHANGED_EVENT, reload);
    };
  }, [reload]);

  const isLoading = state.requestKey !== refreshToken;

  return {
    categories: state.categories,
    tags: state.tags,
    isLoading,
    error: isLoading ? null : state.error,
    reload,
  };
}
