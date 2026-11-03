import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/core/api/app-api";
import { queryKeys } from "@/core/query/keys";
import { MINUTE_MS } from "@/shared/lib/time";

/** GET /club: pontos, selos, lojinha e ranking (abre sem login). Trocas e ranking: club-sheets. */
export function useClub() {
  return useQuery({
    queryKey: queryKeys.club(),
    queryFn: ({ signal }) => appApi.club.get({ signal }),
    staleTime: MINUTE_MS,
  });
}
