import {
  type QueryClient,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { StoreDetail, StoreSummary } from "@/contracts/app/stores";
import type { ListOf } from "@/contracts/common";
import { appApi } from "@/core/api/app-api";
import { errorMessage } from "@/core/api/errors";
import { isStoreDetailKey, queryKeys } from "@/core/query/keys";
import { toast } from "@/design";
import { requireAuth } from "@/features/auth";
import { patchStore } from "../lib/cache-patch";

/*
 * Favoritar e "avisar ofertas": otimistas em todo cache que tem a loja.
 * Depois da resposta, as listas públicas só ficam marcadas como velhas
 * (refetchType "none"): o ERP guarda as leituras ~15 s e um refetch imediato
 * traria o valor antigo, desfazendo o otimista. Só a conta (`me.*`) recarrega.
 */

type Snapshot = [QueryKey, unknown][];

function restore(qc: QueryClient, snapshot: Snapshot | undefined) {
  for (const [key, data] of snapshot ?? []) qc.setQueryData(key, data);
}

/** Só os campos do resumo (a lista de favoritas guarda StoreSummary, não o detalhe). */
function toSummary(s: StoreSummary, isFavorite: boolean): StoreSummary {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category,
    extraCategories: s.extraCategories,
    kinds: s.kinds,
    floor: s.floor,
    block: s.block,
    icon: s.icon,
    brandColor: s.brandColor,
    coverImageUrl: s.coverImageUrl,
    isOpenNow: s.isOpenNow,
    activeCouponsCount: s.activeCouponsCount,
    isFavorite,
  };
}

type FavoriteVars = { store: StoreSummary; on: boolean };

/**
 * Favoritar/desfavoritar com atualização otimista em todo cache que tem a loja
 * (listas, listas infinitas, detalhe e "minhas favoritas"). Pede conta antes.
 * Uso: `const toggleFavorite = useToggleFavorite(); toggleFavorite(store)`.
 */
export function useToggleFavorite(): (store: StoreSummary, on?: boolean) => void {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ store, on }: FavoriteVars) => appApi.stores.setFavorite(store.id, on),
    onMutate: async ({ store, on }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: queryKeys.storesAll() }),
        qc.cancelQueries({ queryKey: queryKeys.me.favorites() }),
      ]);
      const snapshot: Snapshot = [
        ...qc.getQueriesData({ queryKey: queryKeys.storesAll() }),
        ...qc.getQueriesData({ queryKey: queryKeys.me.favorites() }),
      ];
      qc.setQueriesData({ queryKey: queryKeys.storesAll() }, (data: unknown) =>
        patchStore(data, store.id, { isFavorite: on }),
      );
      qc.setQueryData<ListOf<StoreSummary>>(queryKeys.me.favorites(), (data) => {
        if (!data) return data;
        const rest = data.data.filter((s) => s.id !== store.id);
        return { ...data, data: on ? [toSummary(store, true), ...rest] : rest };
      });
      // o toast de sucesso já vibra
      toast.show(
        on ? "Salvo nos favoritos" : "Removido dos favoritos",
        on ? "circle-check" : "circle-minus",
      );
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      restore(qc, context?.snapshot);
      toast.show(errorMessage(error, "Não deu para salvar. Tente de novo."), "circle-x");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.storesAll(), refetchType: "none" });
      void qc.invalidateQueries({ queryKey: queryKeys.me.favorites() });
    },
  });

  return (store, on) => {
    const next = on ?? !store.isFavorite;
    requireAuth(() => mutation.mutate({ store, on: next }), {
      title: "Crie sua conta para salvar favoritas",
      text: "Leva 30 segundos. Suas lojas favoritas ficam juntas no perfil e você não perde nenhuma oferta delas.",
    });
  };
}

/** O que "seguir" precisa da loja (a página da loja e o cupom esgotado passam isso). */
export type FollowableStore = Pick<StoreDetail, "id" | "slug" | "name" | "isFollowing">;

type FollowVars = { store: FollowableStore; on: boolean };

const detailFilters = {
  queryKey: queryKeys.storesAll(),
  predicate: (q: { queryKey: QueryKey }) => isStoreDetailKey(q.queryKey),
};

/**
 * "Avisar ofertas" da loja (página da loja; "Avise-me se voltar" do cupom esgotado).
 * Otimista no detalhe, pede conta antes. Único hook de seguir do app.
 */
export function useToggleFollow(): (store: FollowableStore, on?: boolean) => void {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ store, on }: FollowVars) => appApi.stores.setFollow(store.id, on),
    onMutate: async ({ store, on }) => {
      await qc.cancelQueries(detailFilters);
      const snapshot: Snapshot = qc.getQueriesData(detailFilters);
      qc.setQueriesData(detailFilters, (data: unknown) =>
        patchStore(data, store.id, { isFollowing: on }),
      );
      // o toast de sucesso já vibra
      toast.show(
        on ? `Você vai receber as ofertas da ${store.name}` : "Avisos desligados",
        on ? "circle-check" : "circle-minus",
      );
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      restore(qc, context?.snapshot);
      toast.show(errorMessage(error, "Não deu para mudar os avisos. Tente de novo."), "circle-x");
    },
    onSettled: () => {
      void qc.invalidateQueries({ ...detailFilters, refetchType: "none" });
      void qc.invalidateQueries({ queryKey: queryKeys.me.profile() });
    },
  });

  return (store, on) => {
    const next = on ?? !store.isFollowing;
    requireAuth(() => mutation.mutate({ store, on: next }), {
      title: "Crie sua conta para receber ofertas",
      text: "Com a conta, avisamos quando a loja lançar um cupom novo. Leva 30 segundos.",
    });
  };
}
