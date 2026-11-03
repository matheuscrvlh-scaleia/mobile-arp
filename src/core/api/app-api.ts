import type * as App from "@/contracts/app";
import { APP_ROUTES } from "@/contracts/app/routes";
import type { ListOf, Paginated } from "@/contracts/common";
import type {
  ArtPoint,
  ContentPage,
  ContentPageKey,
  Job,
  RecyclingItem,
} from "@/contracts/content";
import { request } from "./http";

/*
 * Todas as chamadas do app à API do ERP (/api/v1/app/*), uma função por rota
 * do contrato. As telas usam estas funções via hooks do React Query
 * (features/<feature>/api); nunca chamam fetch direto.
 */

const R = APP_ROUTES;

/*
 * Schemas Zod só em dev (conferem a resposta com o contrato do ERP). Em produção
 * o `require` some do bundle e a abertura não paga a construção de ~100 schemas.
 */
const S: typeof import("@/contracts/app") | null = __DEV__
  ? (require("@/contracts/app") as typeof import("@/contracts/app"))
  : null;

/** Conteúdo da ARP (Fase 2): schemas do pacote do painel, também só em dev. */
const C: typeof import("@/contracts/content") | null = __DEV__
  ? (require("@/contracts/content") as typeof import("@/contracts/content"))
  : null;

type Signal = { signal?: AbortSignal };

export const appApi = {
  auth: {
    register: (body: App.RegisterInput) =>
      request<App.Session>({
        route: R.auth.register,
        body,
        schema: S?.sessionSchema,
        anonymous: true,
      }),
    login: (body: App.LoginBody) =>
      request<App.Session>({
        route: R.auth.login,
        body,
        schema: S?.sessionSchema,
        anonymous: true,
      }),
    /**
     * Google/Apple (id_token). Recusas: INVALID_CREDENTIALS (401), EMAIL_USES_OTHER_LOGIN (409,
     * `details.provider`), TERMS_REQUIRED (422: mostrar termos e reenviar com acceptTerms),
     * SERVICE_UNAVAILABLE (503: provedor não configurado no ERP).
     */
    social: (body: App.SocialLoginInput) =>
      request<App.Session>({
        route: R.auth.social,
        body,
        schema: S?.sessionSchema,
        anonymous: true,
      }),
    /** Sempre 204 (não revela se o e-mail existe). */
    forgotPassword: (body: App.ForgotPasswordBody) =>
      request({ route: R.auth.forgotPassword, body, anonymous: true }),
    /** Código de 6 dígitos + nova senha → já entra. Código ruim/vencido: VALIDATION_ERROR. */
    resetPassword: (body: App.ResetPasswordBody) =>
      request<App.Session>({
        route: R.auth.resetPassword,
        body,
        schema: S?.sessionSchema,
        anonymous: true,
      }),
    refresh: (body: App.RefreshBody) =>
      request<App.Session>({
        route: R.auth.refresh,
        body,
        schema: S?.sessionSchema,
        anonymous: true,
        // Folga maior: se a resposta se perder, o ERP aceita o refresh anterior por 60 s.
        timeoutMs: 30_000,
      }),
    /** Revoga o refresh e, com `pushToken`, desvincula o push deste aparelho. */
    logout: (body: App.LogoutBody) =>
      request({ route: R.auth.logout, body, anonymous: true, timeoutMs: 5_000 }),
  },

  me: {
    get: ({ signal }: Signal = {}) =>
      request<App.Me>({ route: R.me.get, schema: S?.meSchema, signal }),
    update: (body: App.UpdateMeBody) =>
      request<App.Me>({ route: R.me.update, body, schema: S?.meSchema }),
    favorites: ({ signal }: Signal = {}) =>
      request<ListOf<App.StoreSummary>>({
        route: R.me.favorites,
        schema: S?.favoriteStoresSchema,
        signal,
      }),
    wallet: (query: Partial<App.WalletQuery>, { signal }: Signal = {}) =>
      request<App.Wallet>({ route: R.me.wallet, query, schema: S?.walletSchema, signal }),
    /** Um pego do visitante (situação atual). 404 se não for dele. */
    claim: (id: string, { signal }: Signal = {}) =>
      request<App.Claim>({ route: R.me.claim, params: { id }, schema: S?.claimSchema, signal }),
  },

  home: ({ signal }: Signal = {}) =>
    request<App.Home>({ route: R.home, schema: S?.homeSchema, signal }),

  stores: {
    categories: ({ signal }: Signal = {}) =>
      request<ListOf<App.StoreCategory>>({
        route: R.stores.categories,
        schema: S?.storeCategoryListSchema,
        signal,
      }),
    list: (query: Partial<App.ListStoresQuery>, { signal }: Signal = {}) =>
      request<Paginated<App.StoreSummary>>({
        route: R.stores.list,
        query,
        schema: S?.storePageSchema,
        signal,
      }),
    get: (idOrSlug: string, { signal }: Signal = {}) =>
      request<App.StoreDetail>({
        route: R.stores.get,
        params: { idOrSlug },
        schema: S?.storeDetailSchema,
        signal,
      }),
    setFavorite: (id: string, on: boolean) =>
      request({ route: on ? R.stores.favorite : R.stores.unfavorite, params: { id } }),
    setFollow: (id: string, on: boolean) =>
      request({ route: on ? R.stores.follow : R.stores.unfollow, params: { id } }),
  },

  map: ({ signal }: Signal = {}) =>
    request<App.MapData>({ route: R.map, schema: S?.mapSchema, signal }),

  agenda: {
    days: (query: { from: string; to: string; categoryId?: string }, { signal }: Signal = {}) =>
      request<App.Agenda>({ route: R.agenda.days, query, schema: S?.agendaSchema, signal }),
    get: (id: string, { signal }: Signal = {}) =>
      request<App.EventDetail>({
        route: R.agenda.get,
        params: { id },
        schema: S?.eventDetailSchema,
        signal,
      }),
    setInterest: (id: string, on: boolean) =>
      request({ route: on ? R.agenda.interest : R.agenda.removeInterest, params: { id } }),
  },

  /** Textos, Circuito Cultural, Sustentarp e vagas (públicos). */
  content: {
    page: (key: ContentPageKey, { signal }: Signal = {}) =>
      request<ContentPage>({
        route: R.content.page,
        params: { key },
        schema: C?.contentPageSchema,
        signal,
      }),
    artPoints: ({ signal }: Signal = {}) =>
      request<ListOf<ArtPoint>>({
        route: R.content.artPoints,
        schema: C?.artPointListSchema,
        signal,
      }),
    recycling: ({ signal }: Signal = {}) =>
      request<ListOf<RecyclingItem>>({
        route: R.content.recycling,
        schema: C?.recyclingItemListSchema,
        signal,
      }),
    jobs: ({ signal }: Signal = {}) =>
      request<ListOf<Job>>({ route: R.content.jobs, schema: C?.jobListSchema, signal }),
  },

  coupons: {
    list: (query: Partial<App.ListCouponsQuery>, { signal }: Signal = {}) =>
      request<Paginated<App.CouponCard>>({
        route: R.coupons.list,
        query,
        schema: S?.couponPageSchema,
        signal,
      }),
    get: (id: string, { signal }: Signal = {}) =>
      request<App.CouponDetail>({
        route: R.coupons.get,
        params: { id },
        schema: S?.couponDetailSchema,
        signal,
      }),
    /** 201 com o pego. Recusas: COUPON_SOLD_OUT, COUPON_NOT_AVAILABLE, COUPON_ALREADY_CLAIMED. */
    claim: (id: string) =>
      request<App.Claim>({ route: R.coupons.claim, params: { id }, schema: S?.claimSchema }),
  },

  challenges: {
    list: ({ signal }: Signal = {}) =>
      request<App.Challenges>({ route: R.challenges.list, schema: S?.challengesSchema, signal }),
    /** Recusas: QR_INVALID (422), QR_EXPIRED (410), SEAL_ALREADY_EARNED (409). */
    scan: (payload: string) =>
      request<App.ScanResult>({
        route: R.challenges.scan,
        body: { payload } satisfies App.ScanQrBody,
        schema: S?.scanResultSchema,
      }),
  },

  pushTokens: {
    register: (body: App.RegisterPushTokenBody) => request({ route: R.pushTokens.register, body }),
    /** Desvincula o token deste aparelho da conta (notificações desligadas no app). */
    remove: (body: App.RemovePushTokenBody) => request({ route: R.pushTokens.remove, body }),
  },

  highlights: {
    impression: (id: string) =>
      request({ route: R.highlights.impression, params: { id }, timeoutMs: 5_000 }),
    click: (id: string) => request({ route: R.highlights.click, params: { id }, timeoutMs: 5_000 }),
  },
} as const;
