/* Procura pegos e cartões nos dados já em cache, sem rede (sem React). */
import type { InfiniteData } from "@tanstack/react-query";
import type {
  Claim,
  CouponCard,
  CouponDetail,
  Wallet,
  WalletStatus,
  WalletTab,
} from "@/contracts/app/coupons";
import { CLAIM_STATUS } from "./claim-status";

export const WALLET_TABS: readonly WalletTab[] = ["active", "used", "expired"];

export const isWalletTab = (v: unknown): v is WalletTab =>
  v === "active" || v === "used" || v === "expired";

/** Aba da carteira de um status (cancelado mora em "expirados"). */
export const tabOf = (status: WalletStatus): WalletTab => CLAIM_STATUS[status].tab;

const isObject = (data: unknown): data is Record<string, unknown> =>
  !!data && typeof data === "object";

function isWalletPages(data: unknown): data is InfiniteData<Wallet> {
  return isObject(data) && Array.isArray(data.pages);
}

export function isCouponDetail(data: unknown): data is CouponDetail {
  return isObject(data) && "myClaim" in data && "stock" in data;
}

/**
 * Uma entrada do cache já separada por quem a coletou (pela chave de `queryKeys`):
 * `wallet` = páginas de uma aba da carteira; `detail` = detalhe de cupom.
 */
export type CachedEntry = { source: "wallet" | "detail"; data: unknown; updatedAt: number };

export type FoundClaim = { claim: Claim; updatedAt: number };

/** Entre as entradas do cache, a versão mais recente do pego `id`. */
export function findClaim(entries: readonly CachedEntry[], id: string): FoundClaim | null {
  let best: FoundClaim | null = null;
  const consider = (claim: Claim, updatedAt: number) => {
    if (!best || updatedAt > best.updatedAt) best = { claim, updatedAt };
  };
  for (const { source, data, updatedAt } of entries) {
    if (source === "wallet") {
      if (!isWalletPages(data)) continue;
      for (const page of data.pages) {
        const hit = page.data.find((c) => c.id === id);
        if (hit) consider(hit, updatedAt);
      }
    } else if (isCouponDetail(data) && data.myClaim?.id === id) {
      consider(data.myClaim, updatedAt);
    }
  }
  return best;
}

/** Insere o pego novo na primeira página da aba "ativos" (ordem por vencimento) e soma no contador. */
export function insertActiveClaim(
  data: InfiniteData<Wallet> | undefined,
  claim: Claim,
): InfiniteData<Wallet> | undefined {
  if (!data) return data;
  if (data.pages.some((p) => p.data.some((c) => c.id === claim.id))) return data;
  const [first, ...rest] = data.pages;
  if (!first) return data;
  const at = Date.parse(claim.expiresAt);
  const list = [...first.data];
  const idx = list.findIndex((c) => Date.parse(c.expiresAt) > at);
  list.splice(idx === -1 ? list.length : idx, 0, claim);
  const counts = { ...first.counts, active: first.counts.active + 1 };
  return {
    ...data,
    pages: [
      { ...first, data: list, counts, meta: { ...first.meta, total: first.meta.total + 1 } },
      ...rest.map((p) => ({ ...p, counts })),
    ],
  };
}

/** Pego ativo deste cupom numa aba "ativos" em cache. */
export function activeClaimFor(
  data: InfiniteData<Wallet> | undefined,
  couponId: string,
): Claim | null {
  for (const page of data?.pages ?? []) {
    const hit = page.data.find((c) => c.coupon.id === couponId && c.status === "active");
    if (hit) return hit;
  }
  return null;
}

/* Cartão de cupom em qualquer dado público ------------------------------- */

function isCouponCard(v: Record<string, unknown>, id: string): v is CouponCard {
  return v.id === id && isObject(v.stock) && isObject(v.store) && typeof v.headline === "string";
}

/**
 * O cartão `id` dentro de qualquer resposta pública em cache (vitrine paginada, home
 * `endingCoupons`, página da loja `coupons`, busca…), sem depender do formato de cada uma:
 * percorre listas e objetos até `depth` níveis.
 */
export function findCouponCard(data: unknown, id: string, depth = 4): CouponCard | undefined {
  if (depth < 0 || !isObject(data)) return undefined;
  if (Array.isArray(data)) {
    for (const item of data) {
      const hit = findCouponCard(item, id, depth - 1);
      if (hit) return hit;
    }
    return undefined;
  }
  if (isCouponCard(data, id)) return data;
  for (const value of Object.values(data)) {
    if (isObject(value)) {
      const hit = findCouponCard(value, id, depth - 1);
      if (hit) return hit;
    }
  }
  return undefined;
}
