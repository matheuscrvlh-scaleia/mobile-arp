/** "Ana Clara Souza" → "Ana". */
export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

/** "Ana Clara Souza" → "AS"; "Ana" → "A". */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
