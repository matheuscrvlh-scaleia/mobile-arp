import { appApi } from "@/core/api/app-api";

/* Métricas dos destaques: "fire and forget" (falha não aparece para o visitante). */

/** Destaques já contados nesta sessão do app (uma exibição por destaque). */
const seen = new Set<string>();

export function trackHighlightImpression(id: string): void {
  if (seen.has(id)) return;
  seen.add(id);
  appApi.highlights.impression(id).catch(() => {});
}

export function trackHighlightClick(id: string): void {
  appApi.highlights.click(id).catch(() => {});
}
