import {
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Agenda, EventDetail } from "@/contracts/app/agenda";
import type { Home } from "@/contracts/app/home";
import { appApi } from "@/core/api/app-api";
import { errorMessage } from "@/core/api/errors";
import { cancelReminder, scheduleReminder } from "@/core/notifications/reminders";
import { queryKeys } from "@/core/query/keys";
import { toast } from "@/design";
import { offerPushNotifications, requireAuth } from "@/features/auth";
import { timeRange } from "@/shared/lib/format";
import { MINUTE_MS } from "@/shared/lib/time";
import { type AgendaRange, type EventRowData, reminderAt } from "../lib/occurrence";

/** Agenda e evento mudam pouco: 5 min (padrão do app para `agenda`/`event`). */
const AGENDA_STALE_MS = 5 * MINUTE_MS;

/**
 * Dias com evento no intervalo. Use `upcomingAgendaRange(today)` para a janela padrão
 * (a mesma da busca). Na virada do dia a chave muda: o dia anterior fica na tela
 * (`keepPreviousData`) até a nova janela chegar, sem voltar ao skeleton.
 */
export function useAgenda({ from, to }: AgendaRange, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.agenda(from, to),
    queryFn: ({ signal }) => appApi.agenda.days({ from, to }, { signal }),
    staleTime: AGENDA_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.event(id ?? ""),
    queryFn: ({ signal }) => appApi.agenda.get(id ?? "", { signal }),
    enabled: !!id,
    staleTime: AGENDA_STALE_MS,
  });
}

/**
 * Prévia do evento já em cache (card da Início ou item de alguma agenda carregada),
 * para a tela do evento abrir com capa e título enquanto o detalhe chega.
 * Não vira `placeholderData` do detalhe: interesse, descrição e loja seriam inventados.
 */
export function findEventPreview(qc: QueryClient, id: string | undefined): EventRowData | null {
  if (!id) return null;
  const fromHome = qc.getQueryData<Home>(queryKeys.home())?.upcomingEvents.find((e) => e.id === id);
  if (fromHome) return fromHome;
  for (const [, agenda] of qc.getQueriesData<Agenda>({ queryKey: queryKeys.agendaAll() })) {
    for (const day of agenda?.days ?? []) {
      const hit = day.events.find((e) => e.id === id);
      if (hit) return hit;
    }
  }
  return null;
}

const reminderKey = (id: string) => `event:${id}`;

/** Agenda o lembrete do dia. false = sem permissão ainda (ou o horário já passou). */
function scheduleEventReminder(event: EventDetail): Promise<boolean> {
  const at = reminderAt(event);
  if (!at) return Promise.resolve(false);
  const when = event.startTime ? `${timeRange(event.startTime, event.endTime)} · ` : "";
  return scheduleReminder({
    key: reminderKey(event.id),
    title: `Hoje na ARP: ${event.title}`,
    body: `${when}${event.place}`,
    at,
    url: `/evento/${event.id}`,
  });
}

/** Lembrete prometido no toast: sem permissão, oferece os avisos e agenda se aceitar. */
function remindOrOffer(event: EventDetail): void {
  const at = reminderAt(event);
  if (!at || at.getTime() <= Date.now()) return;
  void scheduleEventReminder(event).then((scheduled) => {
    if (scheduled) return;
    // depois do toast, como no cupom
    setTimeout(
      () => void offerPushNotifications({ onGranted: () => void scheduleEventReminder(event) }),
      1200,
    );
  });
}

type Vars = { id: string; on: boolean };
type Ctx = { previous: EventDetail | undefined };

/** Mutações de interesse em voo (para só recarregar o detalhe depois da última). */
const INTEREST_MUTATION = ["event-interest"] as const;

/**
 * "Tenho interesse": otimista no detalhe (isInterested/interestsCount), pede
 * conta antes e agenda/cancela o lembrete local do dia.
 */
export function useToggleInterest() {
  const qc = useQueryClient();

  const mutation = useMutation<unknown, unknown, Vars, Ctx>({
    mutationKey: INTEREST_MUTATION,
    mutationFn: ({ id, on }) => appApi.agenda.setInterest(id, on),
    onMutate: async ({ id, on }) => {
      const key = queryKeys.event(id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<EventDetail>(key);
      if (previous) {
        const delta = on === previous.isInterested ? 0 : on ? 1 : -1;
        qc.setQueryData<EventDetail>(key, {
          ...previous,
          isInterested: on,
          interestsCount: Math.max(0, previous.interestsCount + delta),
        });
      }
      toast.show(
        on ? "Evento salvo. Vamos te lembrar no dia!" : "Removido dos seus eventos",
        on ? "heart" : "circle-minus",
      );
      return { previous };
    },
    onSuccess: (_data, { id, on }, ctx) => {
      if (!on) {
        void cancelReminder(reminderKey(id));
        return;
      }
      const event = qc.getQueryData<EventDetail>(queryKeys.event(id)) ?? ctx.previous;
      if (event) remindOrOffer(event);
    },
    onError: (error, { id }, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.event(id), ctx.previous);
      toast.show(
        errorMessage(error, "Não deu para salvar seu interesse. Tente de novo."),
        "circle-alert",
      );
    },
    onSettled: (_data, _error, { id }) => {
      // O ERP limpa o cache do detalhe ao gravar o interesse: o detalhe pode recarregar
      // já (contador real). Com outro toque ainda em voo, espera o último para não
      // desfazer o otimista dele. Listas não mostram interesse; o resumo do perfil não muda.
      if (qc.isMutating({ mutationKey: INTEREST_MUTATION }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.event(id), exact: true });
      }
    },
  });

  /** Alterna o interesse; o estado é lido na hora (depois do login a resposta pode já ter mudado). */
  const toggle = (id: string) =>
    requireAuth(
      () => {
        const current = qc.getQueryData<EventDetail>(queryKeys.event(id));
        mutation.mutate({ id, on: !current?.isInterested });
      },
      {
        title: "Crie sua conta para salvar eventos",
        text: "Com ela a gente te lembra no dia do evento e você ainda ganha selos participando.",
      },
    );

  return { toggle, isPending: mutation.isPending };
}
