/* Formatação pt-BR, sem Intl (o Hermes não garante locale/moeda). Funções puras. */

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;
export const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;
export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;
export const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

const NBSP = " ";
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DateInput = Date | string | number;

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "YYYY-MM-DD" → Date local às 00:00 (new Date("YYYY-MM-DD") seria UTC e cairia no dia anterior). */
export function parseISODate(iso: string): Date {
  const m = ISO_DATE.exec(iso);
  if (!m) return new Date(Number.NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Date | ISO (data ou data-hora) | timestamp → Date. Data pura é tratada como dia local. */
export function toDate(input: DateInput): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  return ISO_DATE.test(input) ? parseISODate(input) : new Date(input);
}

/** Data do calendário local, "YYYY-MM-DD". */
export function toISODate(input: DateInput): string {
  const d = toDate(input);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(input: DateInput, n: number): Date {
  const d = new Date(toDate(input));
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfDay(input: DateInput): Date {
  const d = new Date(toDate(input));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: DateInput, b: DateInput): boolean {
  const x = toDate(a);
  const y = toDate(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

/** Dias no mês da data (28–31). */
export function daysInMonth(input: DateInput): number {
  const d = toDate(input);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** "Sábado, 1 de novembro" */
export function formatLongDate(input: DateInput): string {
  const d = toDate(input);
  return capitalize(`${weekdayName(d).toLowerCase()}, ${d.getDate()} de ${monthName(d)}`);
}

/** "01/11" */
export function formatDayMonth(input: DateInput): string {
  const d = toDate(input);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/** "18:05" (hora local) */
export function formatTime(input: DateInput): string {
  const d = toDate(input);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function weekdayName(input: DateInput, short = false): string {
  const day = toDate(input).getDay();
  return (short ? DIAS_CURTOS[day] : DIAS[day]) ?? "";
}

export function monthName(input: DateInput, short = false): string {
  const month = toDate(input).getMonth();
  return (short ? MESES_CURTOS[month] : MESES[month]) ?? "";
}

/** Contagem regressiva "HH:MM:SS" (horas passam de 24 se precisar). */
export function formatHMS(ms: number): string {
  if (!(ms > 0)) return "00:00:00";
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 3750 → "R$ 37,50" (com espaço não separável depois de R$). */
export function formatMoneyCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.round(Math.abs(cents));
  return `${sign}R$${NBSP}${groupThousands(Math.floor(abs / 100))},${pad2(abs % 100)}`;
}

/** Igual a formatMoneyCents, mas sem ",00": 3700 → "R$ 37", 3750 → "R$ 37,50". */
export function formatMoneyShort(cents: number): string {
  if (Math.round(cents) % 100 !== 0) return formatMoneyCents(cents);
  const sign = cents < 0 ? "-" : "";
  return `${sign}R$${NBSP}${groupThousands(Math.abs(Math.round(cents)) / 100)}`;
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** plural(1, "cupom", "cupons") → "1 cupom"; plural(3, …) → "3 cupons". */
export function plural(n: number, one: string, many: string, withCount = true): string {
  const word = n === 1 ? one : many;
  return withCount ? `${n} ${word}` : word;
}

/** "18:00" → "18h", "18:30" → "18h30", "09:00" → "9h". Aceita "HH:mm:ss". */
export function formatHour(hhmm: string): string {
  const [h = "", m = ""] = hhmm.split(":");
  const hour = Number(h);
  const min = Number(m);
  if (!Number.isFinite(hour)) return hhmm;
  return min > 0 ? `${hour}h${pad2(min)}` : `${hour}h`;
}

/** "10h às 22h"; "16h à 0h" (crase no singular para 0h/1h); sem fim → só o início. */
export function timeRange(start: string, end?: string | null): string {
  const from = formatHour(start);
  if (!end) return from;
  const endHour = Number(end.split(":")[0]);
  const prep = endHour === 0 || endHour === 1 ? "à" : "às";
  return `${from} ${prep} ${formatHour(end)}`;
}
