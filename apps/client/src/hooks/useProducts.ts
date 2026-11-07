import { useCallback, useEffect, useState } from "react";
import { productService } from "../services/product.service.ts";
import { getProductErrorMessage } from "../services/notifications.ts";
import type {
  Product,
  ProductListParams,
  ProductPagination,
} from "../types/product.types.ts";

interface ProductsState {
  products: Product[];
  pagination: ProductPagination | null;
  requestKey: string | null;
  error: string | null;
}

const INITIAL_STATE: ProductsState = {
  products: [],
  pagination: null,
  requestKey: null,
  error: null,
};

export function useProducts(params: ProductListParams) {
  const [state, setState] = useState<ProductsState>(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  const paramsKey = JSON.stringify(params);
  const requestKey = `${paramsKey}#${refreshToken}`;

  useEffect(() => {
    const controller = new AbortController();
    const currentParams = JSON.parse(paramsKey) as ProductListParams;

    productService
      .list(currentParams, controller.signal)
      .then((response) => {
        setState({
          products: response.products,
          pagination: response.pagination,
          requestKey,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          requestKey,
          error: getProductErrorMessage(error),
        }));
      });

    return () => {
      controller.abort();
    };
  }, [paramsKey, requestKey]);

  const reload = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const isLoading = state.requestKey !== requestKey;

  return {
    products: state.products,
    pagination: state.pagination,
    isLoading,
    error: isLoading ? null : state.error,
    reload,
  };
}
