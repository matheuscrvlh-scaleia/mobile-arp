import type { ListCouponsQuery, WalletTab } from "@/contracts/app/coupons";
import type { MerchantPeriod } from "@/contracts/app/merchant";
import type { ListStoresQuery } from "@/contracts/app/stores";

/*
 * Chaves de todas as consultas do app. Três escopos:
 * - "public": navegação livre (com login a resposta vem personalizada, ex.: isFavorite);
 * - "me": dados da conta (somem ao sair).
 * - "merchant": painel do lojista (sessão própria; some quando o lojista sai e nunca é
 *   persistido no cache offline).
 * Entrar ou sair invalida tudo (ver query-client).
 */
export const queryKeys = {
  all: ["public"] as const,
  home: () => ["public", "home"] as const,
  storeCategories: () => ["public", "store-categories"] as const,
  stores: (query: Partial<ListStoresQuery> = {}) => ["public", "stores", "list", query] as const,
  /** Lista paginada infinita (formato diferente da simples: não pode dividir a chave). */
  storesInfinite: (query: Partial<ListStoresQuery> = {}) =>
    ["public", "stores", "infinite", query] as const,
  storesAll: () => ["public", "stores"] as const,
  store: (idOrSlug: string) => ["public", "stores", "detail", idOrSlug] as const,
  map: () => ["public", "map"] as const,
  agenda: (from: string, to: string, categoryId?: string) =>
    ["public", "agenda", { from, to, categoryId }] as const,
  agendaAll: () => ["public", "agenda"] as const,
  event: (id: string) => ["public", "event", id] as const,
  coupons: (query: Partial<ListCouponsQuery> = {}) => ["public", "coupons", "list", query] as const,
  couponsInfinite: (query: Partial<ListCouponsQuery> = {}) =>
    ["public", "coupons", "infinite", query] as const,
  couponsAll: () => ["public", "coupons"] as const,
  coupon: (id: string) => ["public", "coupons", "detail", id] as const,
  challenges: () => ["public", "challenges"] as const,
  /** Busca geral (não persiste; `q` já normalizado). */
  search: (kind: "stores" | "coupons", q: string) => ["public", "search", kind, q] as const,

  me: {
    all: ["me"] as const,
    profile: () => ["me", "profile"] as const,
    favorites: () => ["me", "favorites"] as const,
    wallet: (tab: WalletTab) => ["me", "wallet", tab] as const,
    walletAll: () => ["me", "wallet"] as const,
    /** Um pego (GET /me/claims/:id; abre com o que já está na carteira em cache). */
    claim: (id: string) => ["me", "wallet", "claim", id] as const,
  },

  merchant: {
    all: ["merchant"] as const,
    /** Números da loja num período (`storeId` null = a única loja do lojista). */
    overview: (storeId: string | null, period: MerchantPeriod) =>
      ["merchant", "overview", storeId, period] as const,
    overviewAll: () => ["merchant", "overview"] as const,
  },
} as const;

/** Chave de detalhe de loja (por id ou slug), para patches otimistas. */
export const isStoreDetailKey = (key: readonly unknown[]): boolean =>
  key[0] === "public" && key[1] === "stores" && key[2] === "detail";
