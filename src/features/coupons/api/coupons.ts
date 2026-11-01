import {
  hashKey,
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Claim,
  CouponCard,
  CouponDetail,
  ListCouponsQuery,
  Wallet,
  WalletTab,
} from "@/contracts/app/coupons";
import { appApi } from "@/core/api/app-api";
import { isApiError } from "@/core/api/errors";
import { useSession } from "@/core/auth/session";
import { scheduleReminder } from "@/core/notifications/reminders";
import { queryKeys } from "@/core/query/keys";
import { nextPageParam, PAGE_SIZE } from "@/core/query/pagination";
import { offerPushNotifications } from "@/features/auth";
import { HOUR_MS, SECOND_MS } from "@/shared/lib/time";
import {
  activeClaimFor,
  type CachedEntry,
  findClaim,
  findCouponCard,
  insertActiveClaim,
  isCouponDetail,
  WALLET_TABS,
} from "../lib/claim-cache";
import { applyClaim, markSoldOut } from "../lib/stock";

/** Vitrine de cupons (paginada; no máximo 5 páginas em memória, as do topo voltam ao subir). */
export function useCoupons(query: Partial<ListCouponsQuery> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.couponsInfinite(query),
    queryFn: ({ pageParam, signal }) =>
      appApi.coupons.list({ ...query, page: pageParam, pageSize: PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    getPreviousPageParam: (first) => (first.meta.page > 1 ? first.meta.page - 1 : undefined),
    maxPages: 5,
  });
}

/**
 * Cartão já carregado em qualquer consulta pública (vitrine, home, página da loja, busca),
 * o mais recente, para abrir o detalhe sem tela vazia.
 */
function cachedCard(qc: QueryClient, id: string): CouponCard | undefined {
  let best: { card: CouponCard; at: number } | undefined;
  for (const q of qc.getQueryCache().findAll({ queryKey: queryKeys.all })) {
    if (best && q.state.dataUpdatedAt <= best.at) continue;
    const card = findCouponCard(q.state.data, id);
    if (card) best = { card, at: q.state.dataUpdatedAt };
  }
  return best?.card;
}

/**
 * Detalhe do cupom. Enquanto carrega, mostra o cartão já em cache (`isPlaceholderData`):
 * sem `myClaim` confiável, então a tela não deixa pegar até chegar a resposta.
 */
export function useCoupon(id: string) {
  const qc = useQueryClient();
  return useQuery<CouponDetail, Error, CouponDetail, ReturnType<typeof queryKeys.coupon>>({
    queryKey: queryKeys.coupon(id),
    queryFn: ({ signal }) => appApi.coupons.get(id, { signal }),
    enabled: !!id,
    // o "anterior" seria de outro cupom: só vale o cartão deste
    placeholderData: (): CouponDetail | undefined => {
      const card = cachedCard(qc, id);
      return card ? { ...card, myClaim: null } : undefined;
    },
  });
}

/** Guarda o pego na carteira em cache (o "meu cupom" abre na hora e offline) e agenda o lembrete. */
function rememberClaim(qc: QueryClient, claim: Claim) {
  qc.setQueryData<InfiniteData<Wallet>>(queryKeys.me.wallet("active"), (old) =>
    insertActiveClaim(old, claim),
  );
  qc.setQueryData<Claim>(queryKeys.me.claim(claim.id), claim);
  const remind = () =>
    scheduleReminder({
      key: `claim:${claim.id}`,
      at: new Date(Date.parse(claim.expiresAt) - HOUR_MS),
      title: "Seu cupom vence em 1 hora",
      body: `${claim.coupon.title} · ${claim.store.name}`,
      url: `/carteira/${claim.id}`,
    });
  // Sem permissão ainda: primeiro cupom é a hora certa de oferecer os avisos.
  void remind().then((scheduled) => {
    if (!scheduled) {
      setTimeout(() => void offerPushNotifications({ onGranted: () => void remind() }), 1200);
    }
  });
}

/**
 * Depois de pegar. O ERP limpa o cache do detalhe deste cupom ao gravar: o detalhe já
 * pode recarregar (estoque e `myClaim` reais por cima do `applyClaim`). Vitrine e home
 * seguem no cache de ~15 s do ERP (um refetch agora traria o estoque ANTERIOR): só são
 * marcadas como velhas. A conta recarrega na hora (menos o pego, que acabou de chegar).
 */
function invalidateAfterClaim(qc: QueryClient, couponId: string, claimId: string) {
  const claimHash = hashKey(queryKeys.me.claim(claimId));
  void qc.invalidateQueries({ queryKey: queryKeys.couponsAll(), refetchType: "none" });
  void qc.invalidateQueries({ queryKey: queryKeys.coupon(couponId), exact: true });
  void qc.invalidateQueries({ queryKey: queryKeys.home(), refetchType: "none" });
  void qc.invalidateQueries({
    queryKey: queryKeys.me.walletAll(),
    predicate: (q) => q.queryHash !== claimHash,
  });
  void qc.invalidateQueries({ queryKey: queryKeys.me.profile() });
}

/** Pega o cupom. Os erros (COUPON_SOLD_OUT, …) ficam para a tela tratar. */
export function useClaimCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => appApi.coupons.claim(couponId),
    onSuccess: (claim, couponId) => {
      qc.setQueryData<CouponDetail>(queryKeys.coupon(couponId), (old) =>
        old ? applyClaim(old, claim) : old,
      );
      rememberClaim(qc, claim);
      invalidateAfterClaim(qc, couponId, claim.id);
    },
    onError: (error, couponId) => {
      if (isApiError(error) && error.code === "COUPON_SOLD_OUT") {
        qc.setQueryData<CouponDetail>(queryKeys.coupon(couponId), (old) =>
          old ? markSoldOut(old) : old,
        );
        void qc.invalidateQueries({
          queryKey: queryKeys.couponsAll(),
          predicate: (q) => q.queryHash !== hashKey(queryKeys.coupon(couponId)),
          refetchType: "none",
        });
        void qc.invalidateQueries({ queryKey: queryKeys.home(), refetchType: "none" });
      }
    },
  });
}

/** Falha sem resposta confiável: o servidor pode ter gravado o pego mesmo assim. */
export function isUncertainClaimError(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR" || error.status >= 500)
  );
}

const CONFIRM_TIMEOUT_MS = 10 * SECOND_MS;

/**
 * Depois de um erro incerto: recarrega a aba "ativos" e o detalhe e devolve o pego deste
 * cupom, se o servidor tiver gravado (null se não, ou se a conferência não voltar em 10 s).
 */
export function useConfirmClaim() {
  const qc = useQueryClient();
  return async (couponId: string): Promise<Claim | null> => {
    const check = Promise.allSettled([
      // "all": a carteira pode estar em cache sem nenhuma tela usando
      qc.invalidateQueries(
        { queryKey: queryKeys.me.wallet("active"), exact: true, refetchType: "all" },
        { throwOnError: false },
      ),
      qc.invalidateQueries(
        { queryKey: queryKeys.coupon(couponId), exact: true, refetchType: "all" },
        { throwOnError: false },
      ),
    ]);
    const timeout = new Promise((resolve) => setTimeout(resolve, CONFIRM_TIMEOUT_MS));
    await Promise.race([check, timeout]);
    const found =
      qc.getQueryData<CouponDetail>(queryKeys.coupon(couponId))?.myClaim ??
      activeClaimFor(qc.getQueryData(queryKeys.me.wallet("active")), couponId);
    if (found) {
      rememberClaim(qc, found);
      void qc.invalidateQueries({ queryKey: queryKeys.me.profile() });
    }
    return found;
  };
}

/** Carteira por aba (paginada). Só com conta. */
export function useWallet(tab: WalletTab) {
  const signedIn = useSession((s) => s.status === "signedIn");
  return useInfiniteQuery({
    queryKey: queryKeys.me.wallet(tab),
    queryFn: ({ pageParam, signal }) =>
      appApi.me.wallet({ tab, page: pageParam, pageSize: PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled: signedIn,
  });
}

/* Um pego ----------------------------------------------------------------- */

function cacheEntries(qc: QueryClient): CachedEntry[] {
  const out: CachedEntry[] = [];
  for (const tab of WALLET_TABS) {
    const state = qc.getQueryState(queryKeys.me.wallet(tab));
    if (state?.data !== undefined) {
      out.push({ source: "wallet", data: state.data, updatedAt: state.dataUpdatedAt });
    }
  }
  for (const q of qc.getQueryCache().findAll({
    queryKey: queryKeys.couponsAll(),
    predicate: (q) => isCouponDetail(q.state.data),
  })) {
    out.push({ source: "detail", data: q.state.data, updatedAt: q.state.dataUpdatedAt });
  }
  return out;
}

/** Polling do pego ativo: 15 s, dobrando a cada 4 respostas, até 60 s. */
const POLL_BASE_MS = 15 * SECOND_MS;
const POLL_MAX_MS = 60 * SECOND_MS;

/** O pego não existe ou não é do visitante (`GET /me/claims/:id` → 404). */
export function isClaimNotFound(error: unknown): boolean {
  return isApiError(error) && error.code === "NOT_FOUND";
}

/**
 * Um pego da carteira (`GET /me/claims/:id`). Abre direto do cache (carteira ou detalhe
 * do cupom), inclusive sem sinal no caixa; com rede, confere o estado e, com `poll` (tela
 * em foco), acompanha a validação pela loja enquanto ativo. Atenção: o cache não sabe de
 * quem é a conta; quem mostra confere a sessão.
 */
export function useClaim(id: string, { poll = false }: { poll?: boolean } = {}) {
  const qc = useQueryClient();
  const signedIn = useSession((s) => s.status === "signedIn");
  return useQuery({
    queryKey: queryKeys.me.claim(id),
    queryFn: ({ signal }) => appApi.me.claim(id, { signal }),
    enabled: signedIn && !!id,
    initialData: () => findClaim(cacheEntries(qc), id)?.claim,
    initialDataUpdatedAt: () => findClaim(cacheEntries(qc), id)?.updatedAt,
    refetchInterval: (q) =>
      poll && q.state.data?.status === "active" && !isClaimNotFound(q.state.error)
        ? Math.min(POLL_BASE_MS * 2 ** Math.floor(q.state.dataUpdateCount / 4), POLL_MAX_MS)
        : false,
    retry: (count, error) => count < 2 && isApiError(error) && error.isTransient,
  });
}
