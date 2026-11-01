import type { ListStoresQuery } from "@/contracts/app/stores";

export type StoreFilters = Pick<Partial<ListStoresQuery>, "kind" | "categoryId" | "q" | "openNow">;

/**
 * Filtros do Explorar como vão para a API e para a chave do cache: campo vazio
 * (categoria "Todos", busca em branco, "Aberto agora" desligado) sai, para que
 * "sem filtro" seja sempre a mesma chave e a URL não leve `openNow=false`.
 */
export function storeFilters(input: {
  kind?: ListStoresQuery["kind"];
  categoryId?: string | null;
  q?: string;
  openNow?: boolean;
}): StoreFilters {
  const q = input.q?.trim();
  return {
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(q ? { q } : {}),
    ...(input.openNow ? { openNow: true } : {}),
  };
}
