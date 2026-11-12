import type { StoreHours } from "@/contracts/directory";
import { DIAS, formatHour, timeRange } from "@/shared/lib/format";

/*
 * Horários da loja (um por dia da semana, 0 = domingo; dia ausente = fechado).
 * Fechar antes de abrir significa que passa da meia-noite (16:00 às 00:30):
 * a madrugada pertence ao dia em que abriu.
 */

function toMinutes(hhmm: string): number {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function entryOf(hours: readonly StoreHours[], weekday: number): StoreHours | undefined {
  return hours.find((h) => h.weekday === weekday);
}

const crossesMidnight = (h: StoreHours) => toMinutes(h.closesAt) <= toMinutes(h.opensAt);

/** Turno aberto agora: o de hoje ou a madrugada que sobrou de ontem. */
function activeEntry(hours: readonly StoreHours[], date: Date): StoreHours | undefined {
  const now = date.getHours() * 60 + date.getMinutes();
  const today = entryOf(hours, date.getDay());
  if (today) {
    const open = toMinutes(today.opensAt);
    const close = toMinutes(today.closesAt);
    if (crossesMidnight(today) ? now >= open : now >= open && now < close) return today;
  }
  const yesterday = entryOf(hours, (date.getDay() + 6) % 7);
  if (yesterday && crossesMidnight(yesterday) && now < toMinutes(yesterday.closesAt)) {
    return yesterday;
  }
  return undefined;
}

export function isOpenAt(hours: readonly StoreHours[], date: Date): boolean {
  return activeEntry(hours, date) !== undefined;
}

/** "HH:mm" do fechamento do turno aberto agora (null se fechada). */
export function closingTimeToday(hours: readonly StoreHours[], date: Date): string | null {
  return activeEntry(hours, date)?.closesAt ?? null;
}

/** "à meia-noite", "à 0h30", "à 1h", "às 23h". */
export function atHour(hhmm: string): string {
  if (toMinutes(hhmm) === 0) return "à meia-noite";
  const hour = Number(hhmm.split(":")[0]);
  return `${hour === 0 || hour === 1 ? "à" : "às"} ${formatHour(hhmm)}`;
}

/** Próxima abertura a partir de `date` (até 7 dias à frente). */
export function nextOpening(
  hours: readonly StoreHours[],
  date: Date,
): { opensAt: string; daysAhead: number; weekday: number } | null {
  const now = date.getHours() * 60 + date.getMinutes();
  for (let ahead = 0; ahead < 7; ahead += 1) {
    const weekday = (date.getDay() + ahead) % 7;
    const entry = entryOf(hours, weekday);
    if (!entry) continue;
    if (ahead === 0 && toMinutes(entry.opensAt) <= now) continue;
    return { opensAt: entry.opensAt, daysAhead: ahead, weekday };
  }
  return null;
}

export type OpenStatus = { open: boolean; label: string };

/** "Aberto agora · fecha às 23h" / "Fechado agora · abre amanhã às 11h". */
export function openStatus(hours: readonly StoreHours[], date: Date): OpenStatus {
  const closes = closingTimeToday(hours, date);
  if (closes) return { open: true, label: `Aberto agora · fecha ${atHour(closes)}` };
  const next = nextOpening(hours, date);
  if (!next) return { open: false, label: "Fechado agora" };
  const when =
    next.daysAhead === 0
      ? ""
      : next.daysAhead === 1
        ? "amanhã "
        : `${(DIAS[next.weekday] ?? "").toLowerCase()} `;
  return { open: false, label: `Fechado agora · abre ${when}${atHour(next.opensAt)}` };
}

/** Horário do dia de `date`: "11h às 23h", "16h à 0h" ou "Fechado hoje". */
export function formatHoursToday(hours: readonly StoreHours[], date: Date): string {
  const today = entryOf(hours, date.getDay());
  return today ? timeRange(today.opensAt, today.closesAt) : "Fechado hoje";
}

export type ScheduleRow = { weekday: number; day: string; hours: string; isToday: boolean };

/** Semana de segunda a domingo, com o dia de hoje marcado. */
export function weekSchedule(hours: readonly StoreHours[], date: Date): ScheduleRow[] {
  return [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
    const entry = entryOf(hours, weekday);
    return {
      weekday,
      day: DIAS[weekday] ?? "",
      hours: entry ? timeRange(entry.opensAt, entry.closesAt) : "Fechado",
      isToday: weekday === date.getDay(),
    };
  });
}

/** Os locatários nem sempre cumprem o horário divulgado: o app avisa. */
export const HOURS_NOTICE = "Horário divulgado pela loja. Pode ocorrer variação.";
