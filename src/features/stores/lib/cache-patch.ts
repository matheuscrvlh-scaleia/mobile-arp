/*
 * Atualiza uma loja em qualquer formato de cache sob ["public", "stores"]:
 * detalhe (a própria loja), página ({ data, meta }), lista ({ data }) e
 * lista infinita ({ pages: [{ data, meta }] }). Sem mudança, devolve o mesmo
 * objeto (o React Query não re-renderiza à toa).
 */

type StoreLike = { id: string; slug: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoreLike(value: unknown): value is StoreLike & Record<string, unknown> {
  return isRecord(value) && typeof value.id === "string" && typeof value.slug === "string";
}

function patchArray(list: unknown[], id: string, patch: Record<string, unknown>): unknown[] {
  let changed = false;
  const next = list.map((item) => {
    const patched = patchStore(item, id, patch);
    if (patched !== item) changed = true;
    return patched;
  });
  return changed ? next : list;
}

export function patchStore(data: unknown, id: string, patch: Record<string, unknown>): unknown {
  if (!isRecord(data)) return data;
  if (isStoreLike(data)) {
    if (data.id !== id) return data;
    const differs = Object.keys(patch).some((k) => data[k] !== patch[k]);
    return differs ? { ...data, ...patch } : data;
  }
  if (Array.isArray(data.pages)) {
    const pages = patchArray(data.pages, id, patch);
    return pages === data.pages ? data : { ...data, pages };
  }
  if (Array.isArray(data.data)) {
    const items = patchArray(data.data, id, patch);
    return items === data.data ? data : { ...data, data: items };
  }
  return data;
}

/** Procura a loja (com todos os campos) por id ou slug em qualquer um desses formatos. */
export function findStore<T extends StoreLike>(data: unknown, idOrSlug: string): T | undefined {
  if (!isRecord(data)) return undefined;
  if (isStoreLike(data)) {
    return data.id === idOrSlug || data.slug === idOrSlug ? (data as T) : undefined;
  }
  const list = Array.isArray(data.pages) ? data.pages : Array.isArray(data.data) ? data.data : [];
  for (const item of list) {
    const hit = findStore<T>(item, idOrSlug);
    if (hit) return hit;
  }
  return undefined;
}
