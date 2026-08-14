import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';

import type { Page } from './schemas';

interface PagedQueryOptions<T> {
  queryKey: QueryKey;
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>;
  enabled?: boolean;
}

/**
 * Every list endpoint is cursor-paginated with the same `{ items, nextCursor }`
 * shape, so they all share this wiring.
 */
export function usePagedQuery<T>({ queryKey, fetchPage, enabled = true }: PagedQueryOptions<T>) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

export function flattenPages<T>(data: { pages: Page<T>[] } | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}
