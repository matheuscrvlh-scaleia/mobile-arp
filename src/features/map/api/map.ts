import { useQuery } from "@tanstack/react-query";
import type { StoreSummary } from "@/contracts/app/stores";
import { PAGE_SIZE_MAX, type Paginated } from "@/contracts/common";
import { appApi } from "@/core/api/app-api";
import { queryKeys } from "@/core/query/keys";
import { HOUR_MS, MINUTE_MS } from "@/shared/lib/time";

/** O desenho do mapa muda pouco (vem do ERP). */
const MAP_STALE_MS = HOUR_MS;
const MAP_STORES_STALE_MS = 5 * MINUTE_MS;
/** Teto de páginas de 100 (500 lojas): o mapa nunca puxa um catálogo sem fim. */
const MAP_STORES_MAX_PAGES = 5;

export function useMapData() {
  return useQuery({
    queryKey: queryKeys.map(),
    queryFn: ({ signal }) => appApi.map({ signal }),
    staleTime: MAP_STALE_MS,
  });
}

const MAP_STORES_QUERY = { pageSize: PAGE_SIZE_MAX } as const;

/**
 * Todas as lojas (foto, categoria, bloco) para enriquecer a lista do mapa, que só tem o pino.
 * Lê a 1ª página de 100 e, se houver mais, as seguintes em paralelo (até 5 páginas).
 * Guarda tudo numa página só (`{ data, meta }`) sob `stores`: favoritar continua
 * corrigindo este cache como qualquer outra lista.
 */
async function fetchMapStores(signal: AbortSignal): Promise<Paginated<StoreSummary>> {
  const first = await appApi.stores.list({ ...MAP_STORES_QUERY, page: 1 }, { signal });
  const last = Math.min(first.meta.totalPages, MAP_STORES_MAX_PAGES);
  if (last <= 1) return first;
  const rest = await Promise.all(
    Array.from({ length: last - 1 }, (_, i) =>
      appApi.stores.list({ ...MAP_STORES_QUERY, page: i + 2 }, { signal }),
    ),
  );
  return { ...first, data: [...first.data, ...rest.flatMap((p) => p.data)] };
}

/** Fora do hook: mesma função a cada render, o `Map` só é refeito quando os dados mudam. */
const byId = (res: Paginated<StoreSummary>) => new Map(res.data.map((s) => [s.id, s]));

export function useMapStores() {
  return useQuery({
    queryKey: queryKeys.stores(MAP_STORES_QUERY),
    queryFn: ({ signal }) => fetchMapStores(signal),
    staleTime: MAP_STORES_STALE_MS,
    select: byId,
  });
}
