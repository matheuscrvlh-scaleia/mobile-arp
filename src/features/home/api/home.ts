import { type QueryClient, useQuery } from "@tanstack/react-query";
import type { StoreKind } from "@/contracts/directory";
import { appApi } from "@/core/api/app-api";
import { queryKeys } from "@/core/query/keys";
import { useStores } from "@/features/stores";

/**
 * GET /home: destaques, cupons acabando, total de cupons no ar (badge do atalho Cupons),
 * próximos eventos e resumo do mês.
 */
export function useHome() {
  return useQuery({
    queryKey: queryKeys.home(),
    queryFn: ({ signal }) => appApi.home({ signal }),
  });
}

/** Filtro das 4 lojas de "Hoje na ARP" (Comer / Comprar). */
const homeStoresQuery = (kind: StoreKind) => ({ kind, pageSize: 4 }) as const;

/** As 4 lojas de "Hoje na ARP" (mesma chave da lista de lojas com esse filtro). */
export function useHomeStores(kind: StoreKind) {
  return useStores(homeStoresQuery(kind));
}

/** "Puxar para atualizar" da Início: a home e o que os atalhos/abas mostram. */
export function refreshHome(qc: QueryClient): Promise<unknown> {
  return Promise.allSettled([
    qc.refetchQueries({ queryKey: queryKeys.home(), exact: true }),
    qc.invalidateQueries({ queryKey: queryKeys.stores(homeStoresQuery("food")), exact: true }),
    qc.invalidateQueries({ queryKey: queryKeys.stores(homeStoresQuery("shop")), exact: true }),
  ]);
}
