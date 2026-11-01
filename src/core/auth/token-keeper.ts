import * as SecureStore from "expo-secure-store";
import { ApiError, isApiError } from "@/core/api/errors";
import type { AuthBridge } from "@/core/api/http";

/*
 * Guarda e renova os tokens de UMA sessão (visitante ou lojista):
 * - refresh (rotativo) e access no SecureStore; access também em memória;
 * - renovação "single-flight": duas renovações com o mesmo refresh fariam a
 *   API ver reuso e derrubar a família (ela tolera o refresh anterior por 60 s,
 *   então repetir depois de uma falha de rede é seguro);
 * - "geração": resposta de refresh que chega depois de sair é descartada;
 * - pausa depois de 429/503 (Retry-After).
 */

/** Pausa padrão depois de um 429/503 na renovação sem Retry-After. */
const REFRESH_COOLDOWN_MS = 30_000;
/** Renova antes de vencer: rota pública com token vencido não personaliza. */
const EXPIRY_MARGIN_MS = 30_000;

export interface TokenSession {
  accessToken: string;
  /** Segundos até o access vencer. */
  expiresIn: number;
  refreshToken: string;
}

export interface TokenKeeperOptions<S extends TokenSession> {
  /** Prefixo das chaves no SecureStore (ex.: "arp" → arp.refreshToken). */
  storageKey: string;
  refresh: (refreshToken: string) => Promise<S>;
  /** Revoga um refresh na API (sessão que chegou depois de sair). */
  revoke: (refreshToken: string) => Promise<unknown>;
  /** Cada sessão nova (login ou renovação): atualiza o perfil guardado. */
  onSession: (session: S) => void;
  /** A API recusou a sessão (vencida, revogada, sem acesso): já foi limpa. */
  onExpired: () => void;
}

export interface TokenKeeper<S extends TokenSession> extends AuthBridge {
  /** Lê os tokens guardados. true = há sessão. */
  restore(): Promise<boolean>;
  /** Login/cadastro/renovação: grava a sessão. */
  apply(session: S): Promise<void>;
  /** Apaga tudo do aparelho e devolve o refresh que havia (para revogar na API). */
  clear(): Promise<string | null>;
  /** Renova já (em paralelo com a abertura) se o access guardado venceu. */
  warmUp(): void;
  hasSession(): boolean;
}

function readStoredAccess(raw: string | null): { token: string; expiresAt: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { token?: unknown; expiresAt?: unknown };
    return typeof parsed.token === "string" && typeof parsed.expiresAt === "number"
      ? { token: parsed.token, expiresAt: parsed.expiresAt }
      : null;
  } catch {
    return null;
  }
}

export function createTokenKeeper<S extends TokenSession>(
  options: TokenKeeperOptions<S>,
): TokenKeeper<S> {
  const REFRESH_KEY = `${options.storageKey}.refreshToken`;
  const ACCESS_KEY = `${options.storageKey}.accessToken`;

  let accessToken: string | null = null;
  let accessExpiresAt = 0;
  let refreshToken: string | null = null;
  let inflight: Promise<string | null> | null = null;
  let generation = 0;
  let refreshBlockedUntil = 0;

  const accessValid = () => !!accessToken && Date.now() < accessExpiresAt - EXPIRY_MARGIN_MS;

  async function apply(session: S): Promise<void> {
    accessToken = session.accessToken;
    accessExpiresAt = Date.now() + session.expiresIn * 1000;
    refreshToken = session.refreshToken;
    options.onSession(session);
    // Só o refresh novo precisa estar gravado antes de seguir (o anterior já foi rotacionado).
    await SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken);
    void SecureStore.setItemAsync(
      ACCESS_KEY,
      JSON.stringify({ token: session.accessToken, expiresAt: accessExpiresAt }),
    ).catch(() => undefined);
  }

  async function clear(): Promise<string | null> {
    const previous = refreshToken;
    generation += 1;
    accessToken = null;
    accessExpiresAt = 0;
    refreshToken = null;
    inflight = null;
    refreshBlockedUntil = 0;
    await Promise.allSettled([
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(ACCESS_KEY),
    ]);
    return previous;
  }

  function refreshOnce(): Promise<string | null> {
    if (inflight) return inflight;
    const token = refreshToken;
    if (!token) return Promise.resolve(null);
    if (Date.now() < refreshBlockedUntil) {
      return Promise.reject(
        new ApiError(
          "RATE_LIMITED",
          "Muitas tentativas seguidas. Tente de novo em instantes.",
          429,
        ),
      );
    }
    const myGeneration = generation;
    const run = async (): Promise<string | null> => {
      try {
        const session = await options.refresh(token);
        if (myGeneration !== generation) {
          // Saiu da conta enquanto renovava: revoga a sessão nova e ignora.
          void options.revoke(session.refreshToken).catch(() => undefined);
          return null;
        }
        await apply(session);
        return accessToken;
      } catch (error) {
        if (myGeneration !== generation) return null;
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          await clear();
          options.onExpired();
          return null;
        }
        if (isApiError(error) && (error.status === 429 || error.status === 503)) {
          refreshBlockedUntil =
            Date.now() + (error.retryAfter ? error.retryAfter * 1000 : REFRESH_COOLDOWN_MS);
        }
        // Sem rede ou servidor ocupado: mantém a sessão; a próxima tentativa reusa o mesmo refresh.
        throw error;
      }
    };
    const pending = run().finally(() => {
      if (inflight === pending) inflight = null;
    });
    inflight = pending;
    return pending;
  }

  return {
    async restore() {
      const [stored, storedAccess] = await Promise.all([
        SecureStore.getItemAsync(REFRESH_KEY).catch(() => null),
        SecureStore.getItemAsync(ACCESS_KEY).catch(() => null),
      ]);
      if (!stored) return false;
      refreshToken = stored;
      const access = readStoredAccess(storedAccess);
      if (access) {
        accessToken = access.token;
        accessExpiresAt = access.expiresAt;
      }
      return true;
    },
    async apply(session) {
      generation += 1;
      inflight = null;
      refreshBlockedUntil = 0;
      await apply(session);
    },
    clear,
    warmUp() {
      if (refreshToken && !accessValid()) void refreshOnce().catch(() => undefined);
    },
    hasSession: () => refreshToken !== null,
    async getAccessToken() {
      if (!refreshToken) return null;
      if (accessValid()) return accessToken;
      return refreshOnce();
    },
    refreshAfterUnauthorized() {
      accessToken = null;
      return refreshOnce();
    },
  };
}
