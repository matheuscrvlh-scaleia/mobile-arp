import { useQuery } from "@tanstack/react-query";
import type { ContentPageKey } from "@/contracts/content";
import { appApi } from "@/core/api/app-api";
import { queryKeys } from "@/core/query/keys";
import { HOUR_MS, MINUTE_MS } from "@/shared/lib/time";

/** Textos, pontos e itens mudam pouco: a ARP edita de vez em quando. */
const CONTENT_STALE_MS = HOUR_MS;

export function useContentPage(key: ContentPageKey) {
  return useQuery({
    queryKey: queryKeys.contentPage(key),
    queryFn: ({ signal }) => appApi.content.page(key, { signal }),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useArtPoints() {
  return useQuery({
    queryKey: queryKeys.artPoints(),
    queryFn: ({ signal }) => appApi.content.artPoints({ signal }),
    staleTime: CONTENT_STALE_MS,
    select: (r) => r.data,
  });
}

export function useRecyclingItems() {
  return useQuery({
    queryKey: queryKeys.recycling(),
    queryFn: ({ signal }) => appApi.content.recycling({ signal }),
    staleTime: CONTENT_STALE_MS,
    select: (r) => r.data,
  });
}

/** Vagas no ar (saem sozinhas no prazo; recarrega a cada 10 min). */
export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs(),
    queryFn: ({ signal }) => appApi.content.jobs({ signal }),
    staleTime: 10 * MINUTE_MS,
    select: (r) => r.data,
  });
}
