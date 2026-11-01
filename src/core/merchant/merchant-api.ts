import type * as App from "@/contracts/app";
import { MERCHANT_ROUTES } from "@/contracts/app/merchant";
import type { ChangePasswordBody } from "@/contracts/auth";
import { type AuthBridge, type RouteDef, request } from "@/core/api/http";

/*
 * Painel do lojista (/api/v1/app/merchant/*). Quem entra é usuário do PAINEL
 * (identity.users com `coupons.redeem`), com sessão própria (`merchant-session`),
 * separada da conta de visitante: o mesmo aparelho pode ter as duas.
 */

const M = MERCHANT_ROUTES;

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

  overview: (query: Partial<App.MerchantOverviewQuery>, { signal }: Signal = {}) =>
    request<App.MerchantOverview>({
      route: M.overview,
      query,
      schema: S?.merchantOverviewSchema,
      auth,
      signal,
    }),
} as const;
