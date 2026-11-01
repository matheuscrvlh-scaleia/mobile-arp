import { Platform } from "react-native";
import type { z } from "zod";
import { APP_API_PREFIX } from "@/contracts/app/routes";
import { errorCodeSchema } from "@/contracts/common";
import { env } from "@/core/config/env";
import { ApiError } from "./errors";

/*
 * Cliente HTTP do app. Um só ponto de saída para a API do ERP:
 * - injeta o access token (rotas privadas sempre; públicas quando houver, para personalizar);
 * - renova a sessão uma vez e repete a chamada quando a API responde 401;
 * - converte qualquer falha em ApiError (mensagem pt-BR pronta para a tela);
 * - em dev, confere a resposta com o schema Zod do contrato (aponta divergência com o ERP).
 */

const DEFAULT_TIMEOUT_MS = 15_000;

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions<T> {
  /** Rota do contrato (APP_ROUTES.*). */
  route: RouteDef;
  /** Valores dos `:params` do caminho. */
  params?: Record<string, string>;
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Schema da resposta (validado só em dev). */
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Não envia token (rotas de login, cadastro e refresh). */
  anonymous?: boolean;
  /** Sessão dona do token (padrão: a do visitante). O painel do lojista passa a dele. */
  auth?: AuthBridge;
  /** Prefixo da API (padrão /api/v1/app). Rotas do painel usam /api/v1. */
  prefix?: string;
}

/** O que o cliente precisa de uma rota (APP_ROUTES, MERCHANT_ROUTES…). */
export interface RouteDef {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  public?: true;
}

/** Ponte com a sessão (registrada por core/auth), sem import circular. */
export interface AuthBridge {
  /** Access token válido (renova antes, se estiver para vencer), ou null sem login. */
  getAccessToken(): Promise<string | null>;
  /** Força a renovação depois de um 401. null = sessão perdida. */
  refreshAfterUnauthorized(): Promise<string | null>;
}

/** Sem sessão: nunca há token. */
export const NO_AUTH: AuthBridge = {
  getAccessToken: async () => null,
  refreshAfterUnauthorized: async () => null,
};

let visitorAuth: AuthBridge = {
  getAccessToken: async () => null,
  refreshAfterUnauthorized: async () => null,
};

export function registerAuthBridge(bridge: AuthBridge): void {
  visitorAuth = bridge;
}

export function buildPath(route: RouteDef, params: Record<string, string> = {}): string {
  return route.path.replace(/:([A-Za-z]+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Parâmetro :${name} ausente em ${route.path}`);
    return encodeURIComponent(value);
  });
}

function buildUrl(prefix: string, path: string, query?: Record<string, QueryValue>): string {
  const url = `${env.apiUrl}${prefix}${path}`;
  if (!query) return url;
  const search = Object.entries(query)
    .filter(
      (entry): entry is [string, string | number | boolean] => entry[1] != null && entry[1] !== "",
    )
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return search ? `${url}?${search}` : url;
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown; requestId?: string };
}

/** Resposta já lida por inteiro (o timeout cobre também o corpo). */
interface RawResponse {
  status: number;
  ok: boolean;
  headers: Headers;
  /** JSON do corpo; null se vazio ou inválido. */
  body: unknown;
}

function fieldErrorsOf(details: unknown): Record<string, string[]> | null {
  if (!details || typeof details !== "object") return null;
  const out: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(details)) {
    if (Array.isArray(messages)) out[field] = messages.filter((m) => typeof m === "string");
  }
  return Object.keys(out).length ? out : null;
}

function toApiError(response: RawResponse): ApiError {
  const error = (response.body as ErrorBody | null)?.error;
  const code = errorCodeSchema.safeParse(error?.code);
  const retryAfter = Number(response.headers.get("retry-after"));
  return new ApiError(
    code.success ? code.data : "UNKNOWN",
    error?.message ?? "Algo deu errado. Tente de novo.",
    response.status,
    fieldErrorsOf(error?.details),
    error?.requestId ?? null,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    error?.details ?? null,
  );
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function send(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  outer?: AbortSignal,
): Promise<RawResponse> {
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  if (outer?.aborted) controller.abort();
  outer?.addEventListener("abort", onOuterAbort);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body: parseJson(text),
    };
  } catch (error) {
    // Cancelado por quem chamou (ex.: React Query desmontou): repassa como está.
    if (outer?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new ApiError("TIMEOUT", "A ARP demorou para responder.", 0);
    }
    throw new ApiError("NETWORK_ERROR", "Sem conexão com a internet.", 0);
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onOuterAbort);
  }
}

function checkInDev<T>(schema: z.ZodType<T> | undefined, data: unknown, route: RouteDef): void {
  if (!__DEV__ || !schema) return;
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(
      `[api] Resposta de ${route.method} ${route.path} fora do contrato. Rode npm run contracts:sync.`,
      result.error.issues.slice(0, 5),
    );
  }
}

/** Identifica a versão do app nos logs do ERP (suporte e, no futuro, versão mínima). */
const CLIENT_HEADERS = {
  Accept: "application/json",
  "X-App-Version": env.appVersion,
  "X-Platform": Platform.OS,
  // O React Query já é o cache do app; o cache HTTP nativo (NSURLCache/OkHttp) poderia
  // devolver a resposta anônima a um pedido logado logo depois do login.
  "Cache-Control": "no-cache",
} as const;

/** Token para a chamada. Rota pública segue anônima se a renovação falhar (nunca bloqueia a navegação). */
async function tokenFor(
  auth: AuthBridge,
  anonymous: boolean,
  isPublic: boolean,
): Promise<string | null> {
  if (anonymous) return null;
  if (isPublic) return auth.getAccessToken().catch(() => null);
  return auth.getAccessToken();
}

export async function request<T = void>(options: RequestOptions<T>): Promise<T> {
  const { route, params, query, body, schema, signal } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(options.prefix ?? APP_API_PREFIX, buildPath(route, params), query);
  const isPublic = route.public === true;
  const auth = options.auth ?? visitorAuth;

  const attempt = (token: string | null) => {
    const headers: Record<string, string> = { ...CLIENT_HEADERS };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    return send(
      url,
      {
        method: route.method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      timeoutMs,
      signal,
    );
  };

  const token = await tokenFor(auth, options.anonymous === true, isPublic);
  if (!token && !isPublic) {
    throw new ApiError("UNAUTHENTICATED", "Entre na sua conta para continuar.", 401);
  }

  let response = await attempt(token);
  // Rota pública nunca responde 401 por token vencido (só deixa de personalizar).
  if (response.status === 401 && token && !isPublic) {
    const renewed = await auth.refreshAfterUnauthorized();
    if (renewed) response = await attempt(renewed);
  }

  if (!response.ok) throw toApiError(response);
  if (response.status === 204) return undefined as T;
  if (response.body === null) {
    throw new ApiError("UNKNOWN", "Resposta inválida da ARP.", response.status);
  }
  checkInDev(schema, response.body, route);
  return response.body as T;
}
