import { STORE_KIND_LABEL, type StoreKind, storeKindSchema } from "@/contracts/directory";
import type { KnownIconName } from "@/design";

/** Ícone de cada uma das 3 categorias do app (Fase 2). */
export const STORE_KIND_ICONS: Record<StoreKind, KnownIconName> = {
  shop: "shopping-bag",
  food: "utensils",
  service: "briefcase",
};

/** As 3 categorias na ordem do app: Lojas, Gastronomia, Serviços. */
export const STORE_KIND_OPTIONS = storeKindSchema.options.map((value) => ({
  value,
  label: STORE_KIND_LABEL[value],
  icon: STORE_KIND_ICONS[value],
}));

/** `?tipo=` da rota; inválido ou ausente = `fallback`. */
export function parseStoreKind(value: string | undefined, fallback: StoreKind = "shop"): StoreKind {
  const parsed = storeKindSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
