/* Onde a loja fica ("Bloco 80 · Térreo"), num formato só para o app inteiro. */

type Located = { block: { name: string }; floor: { label: string } };

/** "Bloco 80" → "B80" (como no cartão do protótipo); outros nomes ficam como estão. */
export function shortBlock(name: string): string {
  return name.startsWith("Bloco ") ? `B${name.slice("Bloco ".length)}` : name;
}

/** "Bloco 80 · Térreo"; com `short`, "B80 · Térreo" (cartões e linhas de lista). */
export function storeLocation(store: Located, options?: { short?: boolean }): string {
  const block = options?.short ? shortBlock(store.block.name) : store.block.name;
  return `${block} · ${store.floor.label}`;
}
