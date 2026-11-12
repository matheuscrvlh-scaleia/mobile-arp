import type { ClubSeal, TrevoEntry } from "@/contracts/app/club";

/** "1 Trevo", "30 Trevos" (a moeda do Clube ARP). */
export function formatTrevos(n: number): string {
  return `${n.toLocaleString("pt-BR")} ${Math.abs(n) === 1 ? "Trevo" : "Trevos"}`;
}

/** Legado: o Clube agora conta em Trevos. */
export const formatPoints = formatTrevos;

/** "+10 Trevos" / "−20 Trevos" (sinal de menos tipográfico). */
export function signedTrevos(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatTrevos(Math.abs(n))}`;
}

/** dd/mm no fuso de São Paulo. */
export function dayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/** dd/mm/aaaa no fuso de São Paulo. */
export function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/** "Novembro de 2026" no fuso de São Paulo. */
export function monthYear(iso: string): string {
  const s = new Date(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "02 selos", "1 selo", "0 selos" (o cartão da categoria). */
export function sealCountLabel(times: number): string {
  return `${String(times).padStart(2, "0")} ${times === 1 ? "selo" : "selos"}`;
}

/** Porcentagem (0–100) até o próximo prêmio. */
export function nextPrizePercent(total: number, prizePoints: number): number {
  if (prizePoints <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((total / prizePoints) * 100)));
}

/** Conquistas somadas e a mais recente (para "6 selos conquistados · último: Energia"). */
export function sealsSummary(seals: readonly ClubSeal[]): { total: number; last: string | null } {
  let total = 0;
  let last: ClubSeal | null = null;
  for (const s of seals) {
    total += s.times;
    if (s.lastEarnedAt && (!last?.lastEarnedAt || s.lastEarnedAt > last.lastEarnedAt)) last = s;
  }
  return { total, last: last?.seal.name ?? null };
}

/** Conquistas de uma categoria (selo), do extrato. */
export function entriesOfSeal(entries: readonly TrevoEntry[], sealId: string): TrevoEntry[] {
  return entries.filter((e) => e.kind === "earned" && e.seal?.id === sealId);
}

/** Dias inteiros até `iso` (0 = hoje ou já passou). */
export function daysUntil(iso: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now) / 86_400_000));
}

/** Texto padrão de retirada quando a ARP não escreveu um no prêmio. */
export const DEFAULT_PICKUP_RULES =
  "Mostre o código no Mercado Local em até 7 dias. A equipe confere e entrega o prêmio. Se não retirar no prazo, os Trevos voltam para você.";
