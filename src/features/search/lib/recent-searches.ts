import { normalizeText } from "@/shared/lib/text";

export const RECENT_SEARCHES_KEY = "arp.recent-searches";
export const RECENT_SEARCHES_MAX = 6;

/** Coloca a busca no topo, sem repetir (ignorando acento/maiúscula), com no máximo 6. */
export function pushRecent(list: readonly string[], q: string): string[] {
  const term = q.trim();
  if (term.length < 2) return [...list];
  const key = normalizeText(term);
  return [term, ...list.filter((t) => normalizeText(t) !== key)].slice(0, RECENT_SEARCHES_MAX);
}

/** Lê o JSON guardado; qualquer coisa inválida vira lista vazia. */
export function parseRecent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((t): t is string => typeof t === "string").slice(0, RECENT_SEARCHES_MAX)
      : [];
  } catch {
    return [];
  }
}
