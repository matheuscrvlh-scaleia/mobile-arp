/** Minúsculas e sem acento, para comparar buscas ("Café" casa com "cafe"). */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** `text` contém a busca `q` (ignorando acentos e maiúsculas). Busca vazia casa com tudo. */
export function matchesQuery(text: string, q: string): boolean {
  const needle = normalizeText(q);
  return !needle || normalizeText(text).includes(needle);
}
