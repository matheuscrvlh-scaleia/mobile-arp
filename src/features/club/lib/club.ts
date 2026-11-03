import type { ClubSeal } from "@/contracts/app/club";

/** "1 ponto", "30 pontos". */
export function formatPoints(n: number): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "ponto" : "pontos"}`;
}

/** dd/mm no fuso de São Paulo. */
export function dayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/** O que mostrar no selo: "vence dd/mm", "venceu dd/mm" ou "+N pontos". */
export function sealStateLabel(s: ClubSeal): string {
  if (s.state === "active" && s.expiresAt) return `vence ${dayMonth(s.expiresAt)}`;
  if (s.state === "expired" && s.expiresAt) return `venceu ${dayMonth(s.expiresAt)}`;
  return `+${formatPoints(s.points)}`;
}

/** Porcentagem (0–100) até o próximo prêmio. */
export function nextPrizePercent(total: number, prizePoints: number): number {
  if (prizePoints <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((total / prizePoints) * 100)));
}
