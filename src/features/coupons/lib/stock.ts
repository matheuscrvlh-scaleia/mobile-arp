/* Regras puras de estoque, economia e ordenação dos cupons (sem React). */
import type { Claim, CouponCard, CouponDetail } from "@/contracts/app/coupons";

type Stock = CouponCard["stock"];

/** "restam N" fica vermelho (.urgent) a partir daqui. */
export const URGENT_AT = 3;
/** Filtro "Acabando" do protótipo: restam de 1 a 5. */
export const ENDING_AT = 5;
/** Acima disso a grade de quadrados vira barra (centenas de Views por tela pesam e viram ruído). */
export const STOCK_GRID_MAX = 60;

export const isSoldOut = (stock: Stock): boolean => stock.remaining <= 0;

export const isUrgent = (remaining: number): boolean => remaining > 0 && remaining <= URGENT_AT;

export const isEnding = (stock: Stock): boolean =>
  stock.remaining > 0 && stock.remaining <= ENDING_AT;

/** Fração que resta (0..1), para a barra do cartão. */
export function stockRatio(stock: Stock): number {
  if (stock.total <= 0) return 0;
  return Math.min(1, Math.max(0, stock.remaining / stock.total));
}

/** Unidades já pegas (ou usadas). */
export function takenCount(stock: Stock): number {
  return Math.min(stock.total, Math.max(0, stock.total - stock.remaining));
}

/** Colunas da grade: até 15 numa linha só; acima disso, duas linhas. */
export function stockColumns(total: number): number {
  if (total <= 0) return 1;
  return total <= 15 ? total : Math.ceil(total / 2);
}

export const showsStockGrid = (total: number): boolean => total > 0 && total <= STOCK_GRID_MAX;

export type StockCell = "free" | "taken" | "me";

/** Um quadrado por unidade: os pegos primeiro; o último pego é o do visitante, se ele tiver. */
export function stockCells(stock: Stock, mine: boolean): StockCell[] {
  const taken = takenCount(stock);
  return Array.from({ length: Math.max(0, stock.total) }, (_, i): StockCell => {
    if (i >= taken) return "free";
    return mine && i === taken - 1 ? "me" : "taken";
  });
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

/* Economia --------------------------------------------------------------- */

/** Soma do que o visitante economizou nos cupons usados. */
export function totalSavingsCents(claims: readonly Pick<Claim, "status" | "coupon">[]): number {
  let sum = 0;
  for (const c of claims) {
    if (c.status === "used" && c.coupon.savingsCents) sum += c.coupon.savingsCents;
  }
  return sum;
}

/* Ordenação -------------------------------------------------------------- */

/** Esgotados por último, mantendo a ordem da API entre os demais. */
export function soldOutLast<T extends { stock: Stock }>(coupons: readonly T[]): T[] {
  const available: T[] = [];
  const soldOut: T[] = [];
  for (const c of coupons) (isSoldOut(c.stock) ? soldOut : available).push(c);
  return available.concat(soldOut);
}

/** Pegos ativos por vencimento (o que vence antes primeiro). */
export function byExpiry<T extends Pick<Claim, "expiresAt">>(claims: readonly T[]): T[] {
  return [...claims].sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
}

/** O próximo a vencer entre os ativos ainda no prazo. */
export function nextExpiring<T extends Pick<Claim, "expiresAt" | "status">>(
  claims: readonly T[],
  now: number,
): T | null {
  const live = claims.filter((c) => c.status === "active" && Date.parse(c.expiresAt) > now);
  return byExpiry(live)[0] ?? null;
}

/* Pego ------------------------------------------------------------------- */

/** Detalhe depois de pegar: guarda o pego e desconta uma unidade. */
export function applyClaim(detail: CouponDetail, claim: Claim): CouponDetail {
  return {
    ...detail,
    myClaim: claim,
    stock: { ...detail.stock, remaining: Math.max(0, detail.stock.remaining - 1) },
  };
}

/** "Esgotou" recusado pela API: zera o que resta aqui mesmo (refazer a consulta traria o valor velho). */
export function markSoldOut<T extends { stock: Stock }>(coupon: T): T {
  return { ...coupon, stock: { ...coupon.stock, remaining: 0 } };
}
