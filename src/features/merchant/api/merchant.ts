import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MerchantLoginBody, MerchantPeriod } from "@/contracts/app/merchant";
import type { ChangePasswordBody } from "@/contracts/auth";
import { merchantApi } from "@/core/merchant/merchant-api";
import { useMerchantSession } from "@/core/merchant/merchant-session";
import { queryKeys } from "@/core/query/keys";
import { MINUTE_MS, SECOND_MS } from "@/shared/lib/time";

/*
 * Consultas e mutações do painel do lojista. Tudo no escopo "merchant" do cache: some
 * quando o lojista sai (query-client) e nunca vai para o cache offline.
 */

/** Atualiza sozinho com a tela em foco (o ERP guarda a resposta ~15 s e limpa ao validar). */
const LIVE_REFETCH_MS = 30 * SECOND_MS;

/** Loja em que o lojista age: `storeId` nas chamadas (admin escolhe; lojista tem a dele). */
function storeScope(): { storeId?: string } {
  const storeId = useMerchantSession.getState().profile?.storeId;
  return storeId ? { storeId } : {};
}

/** GET /merchant/overview: números da loja no período. `live` = tela em foco (polling). */
export function useMerchantOverview(period: MerchantPeriod, { live }: { live: boolean }) {
  const signedIn = useMerchantSession((s) => s.status === "signedIn");
  const storeId = useMerchantSession((s) => s.profile?.storeId ?? null);
  return useQuery({
    queryKey: queryKeys.merchant.overview(storeId, period),
    queryFn: ({ signal }) =>
      merchantApi.overview(storeId ? { period, storeId } : { period }, { signal }),
    enabled: signedIn && storeId !== null,
    staleTime: 15 * SECOND_MS,
    gcTime: 5 * MINUTE_MS,
    refetchInterval: live ? LIVE_REFETCH_MS : false,
    // Trocar de período mantém os números na tela até chegar o novo (só na mesma loja).
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === storeId ? previous : undefined,
  });
}

/** Consulta direta de um código (fora do React: ex. descobrir a hora de um uso recusado). */
export const fetchClaim = (code: string) => merchantApi.claims.lookup({ code, ...storeScope() });

/** GET /merchant/claims/lookup: consulta o código antes de confirmar o uso. */
export function useLookupClaim() {
  return useMutation({ mutationFn: fetchClaim });
}

/** POST /merchant/claims/redeem: usa o código. Os números da loja recarregam na hora. */
export function useRedeemClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => merchantApi.claims.redeem({ code, ...storeScope() }),
    // Usou, ou foi recusado porque o pego mudou (usado em outro caixa, venceu): os números
    // mudaram. Escopo só do lojista e o ERP limpa o cache dele ao validar: pode recarregar já.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.merchant.overviewAll() });
    },
  });
}

/** Cupons da loja (rota do painel): "Aguardando ARP" até a aprovação. */
export function useMerchantCoupons(storeId: string) {
  return useQuery({
    queryKey: queryKeys.merchant.coupons(storeId),
    queryFn: ({ signal }) => merchantApi.coupons.list(storeId, { signal }),
    select: (r) => r.data,
  });
}

/** Vagas no ar da loja (rota do painel). */
export function useMerchantJobs(storeId: string) {
  return useQuery({
    queryKey: queryKeys.merchant.jobs(storeId),
    queryFn: ({ signal }) => merchantApi.jobs.list(storeId, { signal }),
    select: (r) => r.data,
  });
}

/** POST /merchant/auth/login. A tela grava a sessão (merchantSession.signIn). */
export function useMerchantLogin() {
  return useMutation({
    mutationFn: (body: MerchantLoginBody) => merchantApi.auth.login(body),
  });
}

/** POST /api/v1/auth/change-password com o token do lojista. */
export function useChangeMerchantPassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordBody) => merchantApi.auth.changePassword(body),
  });
}
