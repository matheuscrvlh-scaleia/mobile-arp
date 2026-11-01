import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ListStoresQuery, StoreDetail, StoreSummary } from "@/contracts/app/stores";
import { appApi } from "@/core/api/app-api";
import { ApiError } from "@/core/api/errors";
import { useSession } from "@/core/auth/session";
import { queryKeys } from "@/core/query/keys";
import { nextPageParam, PAGE_SIZE } from "@/core/query/pagination";
import { HOUR_MS, MINUTE_MS } from "@/shared/lib/time";
import { findStore } from "../lib/cache-patch";
import type { StoreFilters } from "../lib/store-filters";

/** Lojas mudam pouco ao longo do dia (aberto/fechado é recalculado no aparelho). */
const STORES_STALE_MS = 5 * MINUTE_MS;
/** Categorias quase não mudam. */
const CATEGORIES_STALE_MS = HOUR_MS;
/** Lista infinita guarda no máximo 5 páginas (100 lojas); as mais antigas saem e voltam ao rolar. */
const MAX_PAGES = 5;

export function useStoreCategories() {
  return useQuery({
    queryKey: queryKeys.storeCategories(),
    queryFn: ({ signal }) => appApi.stores.categories({ signal }),
    staleTime: CATEGORIES_STALE_MS,
    select: (res) => res.data,
  });
}

/**
 * Lista paginada (Explorar). Monte os filtros com `storeFilters()`: "Aberto agora"
 * é filtro da API (`openNow`), então as páginas e `meta.total` já contam só as abertas.
 */
export function useStoresInfinite(filters: StoreFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.storesInfinite(filters),
    queryFn: ({ pageParam, signal }) =>
      appApi.stores.list({ ...filters, page: pageParam, pageSize: PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    // com maxPages as primeiras páginas saem do cache: precisam poder voltar
    getPreviousPageParam: (first) => (first.meta.page > 1 ? first.meta.page - 1 : undefined),
    maxPages: MAX_PAGES,
    placeholderData: keepPreviousData,
    staleTime: STORES_STALE_MS,
  });
}

/** Lista curta (uma página). */
export function useStores(query: Partial<ListStoresQuery>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.stores(query),
    queryFn: ({ signal }) => appApi.stores.list(query, { signal }),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: STORES_STALE_MS,
  });
}

/** Slug/id que a API aceita (2 a 80 caracteres). Fora disso a loja não existe. */
const isStoreParam = (s: string) => s.length >= 2 && s.length <= 80;

const notFound = () => Promise.reject(new ApiError("NOT_FOUND", "Loja não encontrada.", 404));

/** Detalhe "parcial" a partir de um resumo já em cache (lista, busca, favoritas). */
function placeholderFrom(qc: QueryClient, slug: string): StoreDetail | undefined {
  const caches = [
    ...qc.getQueriesData({ queryKey: queryKeys.storesAll() }),
    ...qc.getQueriesData({ queryKey: queryKeys.me.favorites() }),
  ];
  for (const [, data] of caches) {
    const hit = findStore<StoreSummary>(data, slug);
    if (hit) return summaryAsDetail(hit);
  }
  return undefined;
}

function summaryAsDetail(s: StoreSummary): StoreDetail {
  return {
    ...s,
    description: "",
    logoUrl: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    website: null,
    mapX: null,
    mapY: null,
    hours: [],
    coupons: [],
    challenge: null,
    isFollowing: false,
  };
}

/**
 * Loja por slug (links antigos com id também funcionam). Abre na hora com capa e
 * nome quando a loja já veio numa lista (`isPlaceholderData`: o resto ainda carrega).
 */
export function useStore(slug: string | undefined) {
  const qc = useQueryClient();
  const key = slug ?? "";
  const valid = isStoreParam(key);
  return useQuery<StoreDetail>({
    queryKey: queryKeys.store(key),
    // slug inválido vira "não encontrada" (em vez de ficar carregando para sempre)
    queryFn: ({ signal }) => (valid ? appApi.stores.get(key, { signal }) : notFound()),
    enabled: slug !== undefined,
    staleTime: STORES_STALE_MS,
    placeholderData: () => (valid ? placeholderFrom(qc, key) : undefined),
  });
}

export function useFavoriteStores() {
  const signedIn = useSession((s) => s.status === "signedIn");
  return useQuery({
    queryKey: queryKeys.me.favorites(),
    queryFn: ({ signal }) => appApi.me.favorites({ signal }),
    enabled: signedIn,
    staleTime: STORES_STALE_MS,
    select: (res) => res.data,
  });
}
