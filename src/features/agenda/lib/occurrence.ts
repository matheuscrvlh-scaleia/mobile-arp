import type { Agenda, AgendaEvent, EventCard } from "@/contracts/app/agenda";
import {
  addDays,
  capitalize,
  type DateInput,
  DIAS,
  daysInMonth,
  formatDayMonth,
  formatLongDate,
  monthName,
  parseISODate,
  timeRange,
  toISODate,
  weekdayName,
} from "@/shared/lib/format";
import { DAY_MS, HOUR_MS } from "@/shared/lib/time";

/* Regras de data da agenda (puras). Datas "YYYY-MM-DD" são sempre dias locais. */

/** Item de `Agenda.days[].events`: os campos do `EventCard` (período inclusive), sem `nextDate`. */
export type { AgendaEvent };

/** Item da agenda ou `EventCard`/detalhe (estes trazem também `nextDate`). */
export type EventRowData = AgendaEvent & { nextDate?: string | null };

/** Período de um evento (o que o detalhe/EventCard trazem). */
export type EventPeriod = Pick<EventCard, "recurrence" | "startsOn" | "endsOn" | "weekday">;

/** Lembrete local: 2 h antes do início; sem horário, às 9h do dia. */
export const REMINDER_LEAD_MS = 2 * HOUR_MS;
const DEFAULT_HOUR = 9;
/** Sem horário de término, o evento do calendário dura 2 h. */
const DEFAULT_DURATION_MS = 2 * HOUR_MS;

/** Janela carregada da agenda (uma consulta só, bem abaixo dos 62 dias da API). */
export const AGENDA_WINDOW_DAYS = 30;

export type AgendaRange = { from: string; to: string };

/**
 * Próximos 30 dias (hoje..hoje+29). Única janela do app: a agenda e a busca usam a
 * mesma, então dividem a mesma chave de cache (`queryKeys.agenda(from, to)`).
 */
export function upcomingAgendaRange(today: DateInput): AgendaRange {
  const from = toISODate(today);
  return { from, to: addDaysISO(from, AGENDA_WINDOW_DAYS - 1) };
}

/** Dias inteiros de `from` até `to` (datas ISO), sem efeito de horário de verão. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);
}

/** `count` datas ISO consecutivas a partir de `from`. */
export function dateRange(from: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => toISODate(addDays(parseISODate(from), i)));
}

export function addDaysISO(iso: string, n: number): string {
  return toISODate(addDays(parseISODate(iso), n));
}

/** "Todo sábado", "Toda sexta" (segunda a sexta são femininos). */
export function weeklyLabel(weekday: number): string {
  const name = (DIAS[weekday] ?? "").toLowerCase();
  return `${weekday === 0 || weekday === 6 ? "Todo" : "Toda"} ${name}`;
}

/**
 * Formato do dia de um evento (o mesmo dia escrito de 3 jeitos, conforme o espaço):
 * - `long`: "Sexta, 8" (linha de evento, seção da agenda);
 * - `short`: "sáb 8" (pill do card da Início);
 * - `date`: "sáb, 08/11" (resultado da busca, sem contexto de mês).
 */
export type EventDayStyle = "long" | "short" | "date";

/** "Hoje" ou o dia no formato pedido (ver `EventDayStyle`). Data inválida → "". */
export function eventDayLabel(iso: string, today: string, style: EventDayStyle = "long"): string {
  if (iso === today) return "Hoje";
  const d = parseISODate(iso);
  if (Number.isNaN(d.getTime())) return "";
  switch (style) {
    case "long":
      return `${DIAS[d.getDay()] ?? ""}, ${d.getDate()}`;
    case "short":
      return `${weekdayName(d, true)} ${d.getDate()}`;
    case "date":
      return `${weekdayName(d, true)}, ${formatDayMonth(d)}`;
  }
}

/** "Hoje" · "Amanhã" · "Sexta, 8" (título da seção do dia na agenda). */
export function sectionDayLabel(iso: string, today: string): string {
  if (iso === addDaysISO(today, 1)) return "Amanhã";
  return eventDayLabel(iso, today);
}

/** Rótulo do dia + horário: "sáb, 08/11 · 18h às 20h" (sem horário, só o dia). */
export function occurrenceLabel(
  event: { startTime: string | null; endTime: string | null },
  date: string,
  today: string,
  style: EventDayStyle = "date",
): string {
  return withTime(eventDayLabel(date, today, style), event);
}

function withTime(label: string, event: { startTime: string | null; endTime: string | null }) {
  if (!event.startTime) return label;
  const time = timeRange(event.startTime, event.endTime);
  return label ? `${label} · ${time}` : time;
}

/** "1 a 3 de nov" · "28 de out a 2 de nov" (curto, para a linha de evento). */
export function shortRangeLabel(startsOn: string, endsOn: string): string {
  const a = parseISODate(startsOn);
  const b = parseISODate(endsOn);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} a ${b.getDate()} de ${monthName(b, true)}`;
  }
  return `${a.getDate()} de ${monthName(a, true)} a ${b.getDate()} de ${monthName(b, true)}`;
}

/** "1 a 31 de outubro" · "28/10 a 02/11" (por extenso no mesmo mês). */
export function longRangeLabel(startsOn: string, endsOn: string): string {
  const a = parseISODate(startsOn);
  const b = parseISODate(endsOn);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} a ${b.getDate()} de ${monthName(b)}`;
  }
  return `${formatDayMonth(a)} a ${formatDayMonth(b)}`;
}

function isMultiDay<T extends { startsOn: string; endsOn: string | null }>(
  p: T,
): p is T & { endsOn: string } {
  return !!p.endsOn && p.endsOn !== p.startsOn;
}

/**
 * Rótulo de data da linha de evento (agenda, busca, Início): "Todo sábado" (semanal),
 * "1 a 3 de nov" (vários dias) ou o dia ("Hoje" / "Sexta, 8"): o da ocorrência na
 * agenda (`date`), senão o próximo (`nextDate`) ou o início.
 */
export function rowDateLabel(event: EventRowData, today: string, date?: string): string {
  if (event.recurrence === "weekly" && event.weekday != null) return weeklyLabel(event.weekday);
  if (event.recurrence === "range" && isMultiDay(event)) {
    return shortRangeLabel(event.startsOn, event.endsOn);
  }
  return eventDayLabel(date ?? event.nextDate ?? event.startsOn, today);
}

/** "Hoje · 18h" · "Todo sábado · 9h às 14h" (sem horário, só a data). */
export function rowWhen(event: EventRowData, today: string, date?: string): string {
  return withTime(rowDateLabel(event, today, date), event);
}

/** Período cobre exatamente um mês do calendário (1 ao último dia). */
export function isWholeMonth(startsOn: string, endsOn: string | null): boolean {
  if (!endsOn) return false;
  const a = parseISODate(startsOn);
  const b = parseISODate(endsOn);
  return (
    a.getDate() === 1 &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear() &&
    b.getDate() === daysInMonth(b)
  );
}

/** Rótulo único de evento longo (agenda, detalhe e Início). */
export const LONG_EVENT_FALLBACK = "Todos os dias";

/** Evento longo: "Todo o mês" quando o período é o mês inteiro; senão "Todos os dias". */
export function longEventLabel(p: Pick<EventPeriod, "startsOn" | "endsOn">): string {
  return isWholeMonth(p.startsOn, p.endsOn) ? "Todo o mês" : LONG_EVENT_FALLBACK;
}

/**
 * "Quando" do detalhe: semanal → "Todo sábado"; longo → "1 a 31 de outubro ·
 * todos os dias"; vários dias → "1 a 3 de novembro · 3 dias"; um dia → data longa.
 */
export function evWhen(event: EventPeriod & { isLongRunning: boolean }): string {
  if (event.recurrence === "weekly" && event.weekday != null) return weeklyLabel(event.weekday);
  if (event.isLongRunning) {
    const period = event.endsOn
      ? longRangeLabel(event.startsOn, event.endsOn)
      : `A partir de ${parseISODate(event.startsOn).getDate()} de ${monthName(parseISODate(event.startsOn))}`;
    return `${period} · todos os dias`;
  }
  if (isMultiDay(event)) {
    const n = daysBetween(event.startsOn, event.endsOn) + 1;
    return `${longRangeLabel(event.startsOn, event.endsOn)} · ${n} dias`;
  }
  return formatLongDate(event.startsOn);
}

/** "HH:mm" → [h, m] (null se inválido). */
export function parseHHmm(hhmm: string | null | undefined): [number, number] | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (h == null || m == null || !Number.isFinite(h) || !Number.isFinite(m)) return null;
  return [h, m];
}

function atTime(iso: string, time: [number, number]): Date {
  const d = parseISODate(iso);
  d.setHours(time[0], time[1], 0, 0);
  return d;
}

type Timing = { nextDate: string | null; startTime: string | null; endTime: string | null };

/** Início local da próxima ocorrência (`nextDate` + `startTime`; sem horário, 9h). */
export function nextStart(event: Timing): Date | null {
  if (!event.nextDate) return null;
  return atTime(event.nextDate, parseHHmm(event.startTime) ?? [DEFAULT_HOUR, 0]);
}

/** Fim local da próxima ocorrência (vira o dia se terminar "antes" do início, ex.: 16h à 0h). */
export function nextEnd(event: Timing): Date | null {
  const start = nextStart(event);
  if (!event.nextDate || !start) return null;
  const end = parseHHmm(event.endTime);
  if (!end) return new Date(start.getTime() + DEFAULT_DURATION_MS);
  const d = atTime(event.nextDate, end);
  if (d.getTime() <= start.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

/** Quando lembrar: 2 h antes do início; sem horário, às 9h do dia. */
export function reminderAt(event: Timing): Date | null {
  const start = nextStart(event);
  if (!start) return null;
  if (!parseHHmm(event.startTime)) return start;
  return new Date(start.getTime() - REMINDER_LEAD_MS);
}

/** Barra do período: um traço por dia, `index` = posição do dia (0…total-1). */
export type PeriodProgress = { total: number; index: number };

/**
 * Progresso do dia `day` no período. Sem fim (ou período maior que 62 dias),
 * usa o mês do dia, como no protótipo.
 */
export function periodProgress(
  period: { startsOn: string; endsOn: string | null } | null,
  day: string,
): PeriodProgress {
  if (period?.endsOn) {
    const total = daysBetween(period.startsOn, period.endsOn) + 1;
    if (total > 0 && total <= 62) {
      const index = Math.min(Math.max(daysBetween(period.startsOn, day), 0), total - 1);
      return { total, index };
    }
  }
  const d = parseISODate(day);
  return { total: daysInMonth(d), index: d.getDate() - 1 };
}

/* Agenda --------------------------------------------------------------- */

export type AgendaDay = Agenda["days"][number];

/** Mapa data → eventos (a API só manda os dias que têm evento). */
export function indexDays(days: readonly AgendaDay[]): Map<string, AgendaEvent[]> {
  return new Map(days.map((d) => [d.date, d.events]));
}

/** Ponto na faixa de dias: só quando há evento que não seja longo. */
export function hasShortEvent(events: readonly AgendaEvent[] | undefined): boolean {
  return !!events?.some((e) => !e.isLongRunning);
}

/** Próximas `limit` ocorrências de eventos não longos depois de `after`, sem repetir evento. */
export function upcomingAfter(
  days: readonly AgendaDay[],
  after: string,
  limit = 4,
  exclude: ReadonlySet<string> = new Set(),
): { event: AgendaEvent; date: string }[] {
  const seen = new Set(exclude);
  const out: { event: AgendaEvent; date: string }[] = [];
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sorted) {
    if (day.date <= after) continue;
    for (const event of day.events) {
      if (event.isLongRunning || seen.has(event.id)) continue;
      seen.add(event.id);
      out.push({ event, date: day.date });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export type AgendaCategory = AgendaEvent["category"];

/** Categorias presentes nos eventos carregados, em ordem alfabética. */
export function categoriesOf(days: readonly AgendaDay[]): AgendaCategory[] {
  const map = new Map<string, AgendaCategory>();
  for (const day of days) for (const e of day.events) map.set(e.category.id, e.category);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Filtra os eventos de cada dia pela categoria (null = todas) e descarta dias vazios. */
export function filterByCategory(
  days: readonly AgendaDay[],
  categoryId: string | null,
): AgendaDay[] {
  if (!categoryId) return [...days];
  return days
    .map((d) => ({ date: d.date, events: d.events.filter((e) => e.category.id === categoryId) }))
    .filter((d) => d.events.length > 0);
}

/**
 * Mês da agenda (filtro por mês, Fase 2): `offset` meses antes (negativo) ou depois do
 * mês de `today`. Devolve o intervalo inteiro do mês (do dia 1 ao último).
 */
export function monthRange(today: string, offset: number): AgendaRange & { days: string[] } {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, m - 1 + offset, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const from = iso(first);
  return { from, to: iso(last), days: dateRange(from, last.getUTCDate()) };
}

/** "Novembro 2026" */
export function monthYearLabel(iso: string): string {
  const d = parseISODate(iso);
  return `${capitalize(monthName(d))} ${d.getFullYear()}`;
}
