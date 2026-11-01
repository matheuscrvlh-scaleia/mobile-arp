/* Chips da vitrine de cupons → consulta da API (+ filtro que o protótipo faz no cliente). */
import type { CouponCard, ListCouponsQuery } from "@/contracts/app/coupons";
import { isEnding } from "./stock";

export type CouponFilter = "all" | "food" | "shop" | "ending";

export const COUPON_FILTERS: readonly { value: CouponFilter; label: string; icon?: "flame" }[] = [
  { value: "all", label: "Todos" },
  { value: "food", label: "Comer e beber" },
  { value: "shop", label: "Lojas" },
  { value: "ending", label: "Acabando", icon: "flame" },
];

export function couponQueryFor(filter: CouponFilter): Partial<ListCouponsQuery> {
  switch (filter) {
    case "food":
    case "shop":
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
