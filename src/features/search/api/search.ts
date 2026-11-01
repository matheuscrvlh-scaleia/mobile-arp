import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { appApi } from "@/core/api/app-api";
import { queryKeys } from "@/core/query/keys";
import { normalizeText } from "@/shared/lib/text";
import { MINUTE_MS } from "@/shared/lib/time";

/*
 * Busca geral: lojas e cupons vão para a API (`q`, que já ignora acento e
 * maiúscula: a chave usa o texto normalizado e "Café"/"cafe" dividem o cache).
 * Eventos não têm busca na API: a tela filtra a agenda dos próximos 30 dias.
 */

const RESULTS = 6;
/** Mínimo de letras para buscar. */
export const SEARCH_MIN = 2;
const SEARCH_STALE_MS = 2 * MINUTE_MS;
const SEARCH_GC_MS = 5 * MINUTE_MS;

function searchOptions(q: string) {
  const term = normalizeText(q);
  return {
    term,
    enabled: term.length >= SEARCH_MIN,
    staleTime: SEARCH_STALE_MS,
    gcTime: SEARCH_GC_MS,
    placeholderData: keepPreviousData,
  };
}

export function useStoreSearch(q: string) {
  const { term, ...options } = searchOptions(q);
  return useQuery({
    queryKey: queryKeys.search("stores", term),
    queryFn: ({ signal }) => appApi.stores.list({ q: term, pageSize: RESULTS }, { signal }),
    ...options,
  });
}

export function useCouponSearch(q: string) {
  const { term, ...options } = searchOptions(q);
  return useQuery({
    queryKey: queryKeys.search("coupons", term),
    queryFn: ({ signal }) => appApi.coupons.list({ q: term, pageSize: RESULTS }, { signal }),
    ...options,
  });
}
