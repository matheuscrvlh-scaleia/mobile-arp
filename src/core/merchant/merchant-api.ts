import type * as App from "@/contracts/app";
import { MERCHANT_ROUTES } from "@/contracts/app/merchant";
import type { ChangePasswordBody } from "@/contracts/auth";
import type { ListOf, Paginated } from "@/contracts/common";
import type { CreateJobBody, Job } from "@/contracts/content";
import type { CreateQrCodeBody, QrCode, QrCurrent } from "@/contracts/gamification";
import type { Coupon, CreateCouponInput } from "@/contracts/promotions";
import { ROUTES } from "@/contracts/routes";
import { type AuthBridge, type RouteDef, request } from "@/core/api/http";

/*
 * Painel do lojista (/api/v1/app/merchant/*). Quem entra é usuário do PAINEL
 * (identity.users com `coupons.redeem`), com sessão própria (`merchant-session`),
 * separada da conta de visitante: o mesmo aparelho pode ter as duas.
 */

const M = MERCHANT_ROUTES;
const PANEL = "/api/v1";

/** Rota do painel web (ROUTES.auth.changePassword); local para não trazer o catálogo do painel. */
const CHANGE_PASSWORD: RouteDef = { method: "POST", path: "/auth/change-password" };

const S: typeof import("@/contracts/app") | null = __DEV__
  ? (require("@/contracts/app") as typeof import("@/contracts/app"))
  : null;

type Signal = { signal?: AbortSignal };

/** Liga a API à sessão do lojista (registrada por merchant-session, sem import circular). */
let auth: AuthBridge = {
  getAccessToken: async () => null,
  refreshAfterUnauthorized: async () => null,
};
export function registerMerchantAuth(bridge: AuthBridge): void {
  auth = bridge;
}

export const merchantApi = {
  auth: {
    /** Recusas: INVALID_CREDENTIALS (401), FORBIDDEN (403: sem coupons.redeem ou sem loja). */
    login: (body: App.MerchantLoginBody) =>
      request<App.MerchantSession>({
        route: M.auth.login,
        body,
        schema: S?.merchantSessionSchema,
        anonymous: true,
      }),
    refresh: (body: App.MerchantRefreshBody) =>
      request<App.MerchantSession>({
        route: M.auth.refresh,
        body,
        schema: S?.merchantSessionSchema,
        anonymous: true,
        timeoutMs: 30_000,
      }),
    logout: (body: App.MerchantRefreshBody) =>
      request({ route: M.auth.logout, body, anonymous: true, timeoutMs: 5_000 }),
    /** Rota do painel (/api/v1): o access do lojista é o mesmo token do painel web. */
    changePassword: (body: ChangePasswordBody) =>
      request({ route: CHANGE_PASSWORD, body, auth, prefix: "/api/v1" }),
  },

  claims: {
    /** Recusas: NOT_FOUND, CLAIM_WRONG_STORE (403), FORBIDDEN, VALIDATION_ERROR. */
    lookup: (query: App.MerchantLookupQuery, { signal }: Signal = {}) =>
      request<App.MerchantClaim>({
        route: M.claims.lookup,
        query,
        schema: S?.merchantClaimSchema,
        auth,
        signal,
      }),
    /** + CLAIM_ALREADY_REDEEMED (409), CLAIM_EXPIRED (410), CLAIM_CANCELLED (409). */
    redeem: (body: App.MerchantRedeemBody) =>
      request<App.MerchantClaim>({
        route: M.claims.redeem,
        body,
        schema: S?.merchantClaimSchema,
        auth,
      }),
  },

  /*
   * Rotas do painel (/api/v1) com o mesmo token: a API limita à loja do lojista
   * (cupom criado por lojista fica "Aguardando ARP"; QR só de desafio da loja).
   */
  qrCodes: {
    create: (challengeId: string, body: CreateQrCodeBody) =>
      request<QrCode>({
        route: ROUTES.qrCodes.create,
        params: { id: challengeId },
        body,
        auth,
        prefix: PANEL,
      }),
    current: (id: string, { signal }: Signal = {}) =>
      request<QrCurrent>({
        route: ROUTES.qrCodes.current,
        params: { id },
        auth,
        prefix: PANEL,
        signal,
      }),
  },

  coupons: {
    list: (storeId: string, { signal }: Signal = {}) =>
      request<Paginated<Coupon>>({
        route: ROUTES.coupons.list,
        query: { storeId, pageSize: 50 },
        auth,
        prefix: PANEL,
        signal,
      }),
    create: (body: CreateCouponInput) =>
      request<Coupon>({ route: ROUTES.coupons.create, body, auth, prefix: PANEL }),
  },

  jobs: {
    list: (storeId: string, { signal }: Signal = {}) =>
      request<ListOf<Job>>({
        route: ROUTES.jobs.list,
        query: { storeId, status: "live" },
        auth,
        prefix: PANEL,
        signal,
      }),
    create: (body: CreateJobBody) =>
      request<Job>({ route: ROUTES.jobs.create, body, auth, prefix: PANEL }),
    remove: (id: string) =>
      request({ route: ROUTES.jobs.remove, params: { id }, auth, prefix: PANEL }),
  },

  overview: (query: Partial<App.MerchantOverviewQuery>, { signal }: Signal = {}) =>
    request<App.MerchantOverview>({
      route: M.overview,
      query,
      schema: S?.merchantOverviewSchema,
      auth,
      signal,
    }),
} as const;
