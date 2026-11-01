import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Challenges, ScanResult } from "@/contracts/app/challenges";
import { appApi } from "@/core/api/app-api";
import { queryKeys } from "@/core/query/keys";
import { queryClient } from "@/core/query/query-client";
import { MINUTE_MS } from "@/shared/lib/time";
import { applyScanResult } from "../lib/progress";

/** GET /challenges: campanha no ar, desafios e progresso (personalizado com login). */
export function useChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges(),
    queryFn: ({ signal }) => appApi.challenges.list({ signal }),
    staleTime: 2 * MINUTE_MS,
  });
}

/** Desafios em cache (fora do React: sheets e handlers). */
export function getCachedChallenges(): Challenges | undefined {
  return queryClient.getQueryData<Challenges>(queryKeys.challenges());
}

function onSealEarned(qc: QueryClient, result: ScanResult) {
  // O resultado já traz o progresso novo: corrige o cache sem refazer a consulta
  // (o ERP guarda leituras ~15 s e um refetch agora poderia desfazer o selo na tela).
  qc.setQueryData<Challenges>(queryKeys.challenges(), (data) =>
    data ? applyScanResult(data, result) : data,
  );
  // Público compartilhado: só marca como velho (recarrega quando a tela voltar).
  void qc.invalidateQueries({ queryKey: queryKeys.home(), refetchType: "none" });
  void qc.invalidateQueries({ queryKey: queryKeys.storesAll(), refetchType: "none" });
  // Conta: pode recarregar já.
  void qc.invalidateQueries({ queryKey: queryKeys.me.profile() });
}

/**
 * POST /challenges/scan. Recusas chegam como ApiError: QR_INVALID (422),
 * QR_EXPIRED (410), SEAL_ALREADY_EARNED (409), RATE_LIMITED (429). A tela trata cada uma.
 */
export function useScanSeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: string) => appApi.challenges.scan(payload),
    onSuccess: (result) => onSealEarned(qc, result),
  });
}
