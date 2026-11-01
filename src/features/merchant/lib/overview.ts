/* Regras puras do painel do lojista: estoque, gráfico por hora e rótulos (sem React). */
import type {
  MerchantCouponStats,
  MerchantOverview,
  MerchantPeriod,
} from "@/contracts/app/merchant";
import { formatDayMonth, formatTime, isSameDay } from "@/shared/lib/format";
import { matchesQuery } from "@/shared/lib/text";

/* Estoque ---------------------------------------------------------------- */

type StockInput = Pick<MerchantCouponStats, "total" | "redeemed" | "waiting" | "returned">;

/**
 * Unidades do cupom em quatro grupos que SOMAM o total:
 * usado + aguardando + voltou + livre = total. "Voltou" (venceu sem uso) é a parte dos livres
 * que já foi pega uma vez; `available` = voltou + livre = o que ainda pode ser pego.
 */
export type StockBreakdown = {
  total: number;
  used: number;
  waiting: number;
  returned: number;
  /** Livres que nunca foram pegas. */
  free: number;
  /** Livres agora (voltou + livre). */
  available: number;
};

const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(n) ? Math.floor(n) : 0));

export function stockBreakdown(c: StockInput): StockBreakdown {
  const total = Math.max(0, Math.floor(c.total) || 0);
  const used = clamp(c.redeemed, 0, total);
  const waiting = clamp(c.waiting, 0, total - used);
  const available = total - used - waiting;
  const returned = clamp(c.returned, 0, available);
  return { total, used, waiting, returned, free: available - returned, available };
}

export type StockCellKind = "used" | "waiting" | "returned" | "free";

/** Um quadrado por unidade, na ordem usado → aguardando → voltou → livre. */
export function stockCells(b: StockBreakdown): StockCellKind[] {
  const cells: StockCellKind[] = [];
  const push = (kind: StockCellKind, n: number) => {
    for (let i = 0; i < n; i += 1) cells.push(kind);
  };
  push("used", b.used);
  push("waiting", b.waiting);
  push("returned", b.returned);
  push("free", b.free);
  return cells;
}

/** Acima disso a grade vira barra empilhada (centenas de Views pesam e viram ruído). */
export const STOCK_GRID_MAX = 60;
/** Quadrados por linha, no máximo. */
const GRID_MAX_COLUMNS = 15;

export const showsStockGrid = (total: number): boolean => total > 0 && total <= STOCK_GRID_MAX;

/** Colunas da grade: até 15 numa linha; acima disso, linhas iguais de no máximo 15. */
export function stockColumns(total: number): number {
  if (total <= GRID_MAX_COLUMNS) return Math.max(1, total);
  const rows = Math.ceil(total / GRID_MAX_COLUMNS);
  return Math.ceil(total / rows);
}

/** Quebra as células em linhas de `columns`, completando a última com `null` (alinha a grade). */
export function stockRows<T>(cells: readonly T[], columns: number): (T | null)[][] {
  const cols = Math.max(1, columns);
  const rows: (T | null)[][] = [];
  for (let i = 0; i < cells.length; i += cols) {
    const row: (T | null)[] = cells.slice(i, i + cols);
    while (row.length < cols) row.push(null);
    rows.push(row);
  }
  return rows;
}

/* Usos por hora ---------------------------------------------------------- */

type HourRow = MerchantOverview["redemptionsByHour"][number];

/** Sem movimento no período: o horário do shopping. */
export const DEFAULT_HOUR_WINDOW = { from: 8, to: 23 } as const;
/** Colunas mínimas do gráfico (um uso só não vira uma barra gigante sozinha). */
const MIN_HOUR_COLUMNS = 8;

/** Horas mostradas: do primeiro ao último horário com uso, ±1 h (mínimo de 8 colunas). */
export function hourWindow(rows: readonly HourRow[]): { from: number; to: number } {
  const active = rows.filter((r) => r.count > 0).map((r) => r.hour);
  if (active.length === 0) return { ...DEFAULT_HOUR_WINDOW };
  let from = Math.max(0, Math.min(...active) - 1);
  let to = Math.min(23, Math.max(...active) + 1);
  while (to - from + 1 < MIN_HOUR_COLUMNS) {
    if (to < 23) to += 1;
    if (to - from + 1 < MIN_HOUR_COLUMNS && from > 0) from -= 1;
  }
  return { from, to };
}

/** Hora com mais usos (a primeira, no empate); null sem nenhum uso. */
export function peakHour(rows: readonly HourRow[]): number | null {
  let best: HourRow | null = null;
  for (const r of rows) if (r.count > 0 && (!best || r.count > best.count)) best = r;
  return best ? best.hour : null;
}

export type HourBar = { hour: number; count: number; peak: boolean; showLabel: boolean };

/** Barras do gráfico, já recortadas na janela. Com muitas colunas, só parte dos rótulos aparece. */
export function hourBars(rows: readonly HourRow[]): HourBar[] {
  const counts = new Map(rows.map((r) => [r.hour, r.count]));
  const { from, to } = hourWindow(rows);
  const peak = peakHour(rows);
  const n = to - from + 1;
  const every = n <= 10 ? 1 : n <= 16 ? 2 : 3;
  return Array.from({ length: n }, (_, i) => {
    const hour = from + i;
    return {
      hour,
      count: counts.get(hour) ?? 0,
      peak: hour === peak,
      showLabel: i % every === 0 || hour === peak,
    };
  });
}

export const hourLabel = (hour: number): string => `${hour}h`;

/* Rótulos ---------------------------------------------------------------- */

export const PERIOD_LABEL: Record<MerchantPeriod, string> = {
  today: "Hoje",
  week: "Últimos 7 dias",
  month: "Últimos 30 dias",
};

/** "até hoje, 22:00" · "até 02/11" · "sem data para acabar". */
export function couponWindowLabel(c: Pick<MerchantCouponStats, "endsAt">, now: number): string {
  if (!c.endsAt) return "sem data para acabar";
  if (isSameDay(c.endsAt, now)) return `até hoje, ${formatTime(c.endsAt)}`;
  return `até ${formatDayMonth(c.endsAt)}`;
}

/** Hora de um uso: "21:42" (hoje) ou "31/10 · 21:42" (outro dia). */
export function redemptionTime(iso: string, now: number): string {
  return isSameDay(iso, now) ? formatTime(iso) : `${formatDayMonth(iso)} · ${formatTime(iso)}`;
}

/** "hoje às 14:32" · "31/10 às 14:32". */
export function dayTimeLabel(iso: string, now: number): string {
  return isSameDay(iso, now)
    ? `hoje às ${formatTime(iso)}`
    : `${formatDayMonth(iso)} às ${formatTime(iso)}`;
}

/* Lojas ------------------------------------------------------------------ */

/** A lista de lojas ganha busca a partir daqui. */
export const STORE_SEARCH_MIN = 9;

export function filterStores<T extends { name: string }>(stores: readonly T[], q: string): T[] {
  return stores.filter((s) => matchesQuery(s.name, q));
}
