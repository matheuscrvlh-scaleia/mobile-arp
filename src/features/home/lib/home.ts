/* Regras puras da tela Início. */
import type { Highlight } from "@/contracts/app/home";
import { assertNever } from "@/shared/lib/assert";
import { type DateInput, daysInMonth, toDate } from "@/shared/lib/format";

/** Dias até o fim do mês, contando hoje (como DIAS_RESTANTES do protótipo). */
export function daysLeftInMonth(now: DateInput): number {
  const d = toDate(now);
  return daysInMonth(d) - d.getDate() + 1;
}

/**
 * Linha "quando · onde" do card: "Todo o mês · Ruas internas", "19h · Praça central".
 * O "quando" vem pronto da agenda (`longEventLabel`/`timeRange`), o mesmo texto de lá.
 */
export function eventSubtitle(when: string | null, place: string): string {
  const where = place.split(" · ")[0]?.trim() ?? "";
  return [when, where].filter(Boolean).join(" · ");
}

/** O que o toque num destaque faz: abre um caminho do app, um link externo ou nada. */
export type HighlightAction =
  | { kind: "path"; href: string }
  | { kind: "url"; url: string }
  | { kind: "none" };

const NONE: HighlightAction = { kind: "none" };

const path = (href: string): HighlightAction => ({ kind: "path", href });

/** Para onde um destaque leva ao ser tocado. */
export function highlightTarget(
  h: Pick<Highlight, "targetType" | "targetId" | "targetSlug" | "targetUrl">,
): HighlightAction {
  const id = h.targetId;
  switch (h.targetType) {
    case "event":
      return id ? path(`/evento/${id}`) : NONE;
    case "coupon":
      return id ? path(`/cupom/${id}`) : NONE;
    case "store": {
      // Pelo slug (rota canônica); sem slug (loja apagada no meio), a rota aceita o id.
      const ref = h.targetSlug ?? id;
      return ref ? path(`/loja/${ref}`) : NONE;
    }
    case "url":
      return h.targetUrl ? { kind: "url", url: h.targetUrl } : NONE;
    case "none":
      return NONE;
    default:
      return assertNever(h.targetType);
  }
}

/** Agrupa em pares (linhas da grade de 2 colunas). */
export function pairs<T>(items: readonly T[]): [T, T | undefined][] {
  const rows: [T, T | undefined][] = [];
  for (let i = 0; i < items.length; i += 2) {
    const a = items[i];
    if (a !== undefined) rows.push([a, items[i + 1]]);
  }
  return rows;
}
