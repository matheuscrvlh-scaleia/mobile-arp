import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/core/api/app-api";
import { useSession } from "@/core/auth/session";
import { queryKeys } from "@/core/query/keys";
import { queryClient } from "@/core/query/query-client";
import { MINUTE_MS } from "@/shared/lib/time";

/** GET /club: Trevos, selos, lojinha e ranking (abre sem login). Ranking: club-sheets. */
export function useClub() {
  return useQuery({
    queryKey: queryKeys.club(),
    queryFn: ({ signal }) => appApi.club.get({ signal }),
    staleTime: MINUTE_MS,
  });
}

/** Extrato de Trevos (só com login). */
export function useTrevoStatement() {
  const signedIn = useSession((s) => s.status) === "signedIn";
  return useQuery({
    queryKey: queryKeys.me.trevos(),
    queryFn: ({ signal }) => appApi.club.statement({ signal }),
    staleTime: MINUTE_MS,
    enabled: signedIn,
  });
}

/** Depois de trocar ou desistir: Clube, extrato, perfil e Início. */
export function refreshClub() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.club() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.me.trevos() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.home(), refetchType: "none" });
  void queryClient.invalidateQueries({ queryKey: queryKeys.me.profile() });
}
