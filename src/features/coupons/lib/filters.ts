/* Chips da vitrine de cupons → consulta da API (+ filtro que o protótipo faz no cliente). */
import type { CouponCard, ListCouponsQuery } from "@/contracts/app/coupons";
import { STORE_KIND_LABEL, type StoreKind, storeKindSchema } from "@/contracts/directory";
import { isEnding } from "./stock";

export type CouponFilter = "all" | StoreKind | "ending";

/** Todos, as 3 categorias (Lojas, Gastronomia, Serviços) e Acabando. */
export const COUPON_FILTERS: readonly { value: CouponFilter; label: string; icon?: "flame" }[] = [
  { value: "all", label: "Todos" },
  ...storeKindSchema.options.map((k) => ({ value: k, label: STORE_KIND_LABEL[k] })),
  { value: "ending", label: "Acabando", icon: "flame" },
];

export function couponQueryFor(filter: CouponFilter): Partial<ListCouponsQuery> {
  switch (filter) {
    case "shop":
    case "food":
    case "service":
      return { kind: filter };
    case "ending":
      return { sort: "ending" };
    default:
      return {};
  }
}

/** "Acabando" mostra só os que têm de 1 a 5 unidades, como no protótipo. */
export function filterCoupons(filter: CouponFilter, coupons: readonly CouponCard[]): CouponCard[] {
  return filter === "ending" ? coupons.filter((c) => isEnding(c.stock)) : [...coupons];
}
