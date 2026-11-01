import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateMeBody } from "@/contracts/app/auth";
import { appApi } from "@/core/api/app-api";
import { sessionActions, useSession } from "@/core/auth/session";
import { queryKeys } from "@/core/query/keys";
import { MINUTE_MS } from "@/shared/lib/time";

/** Perfil + resumo do mês. Atualiza o perfil guardado na sessão a cada resposta. */
export function useMe() {
  const signedIn = useSession((s) => s.status === "signedIn");
  return useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: async ({ signal }) => {
      const me = await appApi.me.get({ signal });
      sessionActions.setVisitor(me.visitor);
      return me;
    },
    enabled: signedIn,
    staleTime: 5 * MINUTE_MS,
  });
}

/** PATCH /me (nome, celular, aceite de comunicação). */
export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => appApi.me.update(body),
    // A resposta é o mesmo { visitor, summary } do GET /me.
    onSuccess: (me) => {
      queryClient.setQueryData(queryKeys.me.profile(), me);
      sessionActions.setVisitor(me.visitor);
    },
  });
}
