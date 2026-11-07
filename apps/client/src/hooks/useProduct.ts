import { useCallback, useEffect, useState } from "react";
import { productService } from "../services/product.service.ts";
import { getProductErrorMessage } from "../services/notifications.ts";
import type { Product } from "../types/product.types.ts";

interface ProductState {
  product: Product | null;
  requestKey: string | null;
  error: string | null;
}

export function useProduct(id: number | null) {
  const [state, setState] = useState<ProductState>({
    product: null,
    requestKey: null,
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  const requestKey = `${id ?? "none"}#${refreshToken}`;

  useEffect(() => {
    if (id === null) {
      return;
    }

    let cancelled = false;

    productService
      .getById(id)
      .then((product) => {
        if (cancelled) {
          return;
        }

        setState({ product, requestKey, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setState({
          product: null,
          requestKey,
          error: getProductErrorMessage(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [id, requestKey]);

  const reload = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const isLoading = id !== null && state.requestKey !== requestKey;

  return {
    product: id === null ? null : state.product,
    isLoading,
    error: isLoading ? null : state.error,
    reload,
  };
}
