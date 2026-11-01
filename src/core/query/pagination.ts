import type { PageMeta } from "@/contracts/common";

export const PAGE_SIZE = 20;

/** Próxima página de uma lista paginada (`useInfiniteQuery`), ou undefined no fim. */
export function nextPageParam(last: { meta: PageMeta }): number | undefined {
  const { page, totalPages } = last.meta;
  return totalPages >= 0 && page < totalPages ? page + 1 : undefined;
}
