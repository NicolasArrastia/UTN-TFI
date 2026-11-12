import { useCallback, useEffect, useState } from "react";
import { getTagErrorMessage } from "../services/notifications.ts";
import { tagService } from "../services/tag.service.ts";
import type { Tag } from "../types/catalog.types.ts";

interface TagsState {
  tags: Tag[];
  requestKey: string | null;
  error: string | null;
}

const INITIAL_STATE: TagsState = {
  tags: [],
  requestKey: null,
  error: null,
};

export function useTags(includeInactive: boolean) {
  const [state, setState] = useState<TagsState>(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  const requestKey = `${includeInactive}#${refreshToken}`;

  useEffect(() => {
    const controller = new AbortController();

    tagService
      .list(includeInactive, controller.signal)
      .then((tags) => {
        setState({ tags, requestKey, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          requestKey,
          error: getTagErrorMessage(error),
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
    tags: state.tags,
    isLoading,
    error: isLoading ? null : state.error,
    reload,
  };
}
