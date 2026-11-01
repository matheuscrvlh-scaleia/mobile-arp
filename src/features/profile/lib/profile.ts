import { formatMoneyCents, monthName, toDate } from "@/shared/lib/format";

/** createdAt ISO → "outubro de 2026" (fuso do aparelho). */
export function memberSince(createdAt: string): string {
  return `${monthName(createdAt)} de ${toDate(createdAt).getFullYear()}`;
}

/** 3 selos ou mais = Frequentador (como no protótipo). */
export function visitorLevel(seals: number): "Explorador" | "Frequentador" {
  return seals >= 3 ? "Frequentador" : "Explorador";
}

/** "R$ 37,50" → ["R$ 37", ",50"] (centavos menores no card de economia). */
export function splitMoney(cents: number): [string, string] {
  const text = formatMoneyCents(cents);
  const comma = text.lastIndexOf(",");
  return comma < 0 ? [text, ""] : [text.slice(0, comma), text.slice(comma)];
}
