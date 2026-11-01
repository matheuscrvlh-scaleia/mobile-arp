import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { addNetworkStateListener } from "expo-network";
import { AppState, Platform } from "react-native";
import { isApiError } from "@/core/api/errors";
import { onSessionChange } from "@/core/auth/session";
import { env } from "@/core/config/env";
import { useMerchantSession } from "@/core/merchant/merchant-session";
import { kv } from "@/core/storage/kv";
import { queryKeys } from "./keys";

/*
 * Cliente de consultas. A API guarda as leituras públicas ~15 s; aqui:
 * - staleTime 30 s: navegar entre telas não refaz chamadas à toa;
 * - cache persistido 24 h: o app abre na hora e funciona sem rede (inclusive
 *   o código do cupom na carteira, para mostrar no caixa);
 * - só repete erro transitório (rede, 429, 5xx); 4xx é resposta definitiva.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Muda quando o formato do que guardamos muda (além da versão do app). */
const CACHE_SCHEMA = 1;

/**
 * Espera entre tentativas com jitter (milhares de aparelhos não voltam juntos)
 * e teto de 20 s mesmo quando o servidor pede mais (Retry-After).
 */
function retryDelay(attempt: number, error: unknown): number {
  const base =
    isApiError(error) && error.retryAfter
      ? Math.min(error.retryAfter, 20) * 1000
      : Math.min(1000 * 2 ** attempt, 8000);
  return base / 2 + Math.random() * base;
}

/**
 * Só o que vale abrir sem rede: início, mapa, categorias, desafios e tudo da conta (carteira!).
 * O escopo "merchant" (painel do lojista) nunca é gravado no aparelho.
 */
const PERSISTED_ROOTS = new Set(["home", "map", "store-categories", "challenges"]);

function shouldPersist(queryKey: readonly unknown[]): boolean {
  const [scope, root] = queryKey;
  if (scope === "me") return true;
  return scope === "public" && typeof root === "string" && PERSISTED_ROOTS.has(root);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: DAY_MS,
      retry: (failureCount, error) => {
        if (!isApiError(error)) return failureCount < 2;
        // 429: uma tentativa só; depois a tela mostra o erro e o visitante decide.
        if (error.status === 429) return failureCount < 1;
        return failureCount < 2 && error.isTransient;
      },
      retryDelay,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: { getItem: kv.get, setItem: kv.set, removeItem: kv.remove },
  key: "arp.query-cache",
  // Grava o cache inteiro a cada vez: espaçar evita trabalho na thread JS (paginação, polling).
  throttleTime: 5_000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: DAY_MS,
  // Versão nova do app (ou do formato guardado) descarta o cache antigo.
  buster: `${env.appVersion}:${CACHE_SCHEMA}`,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.state.status === "success" && shouldPersist(query.queryKey),
  },
} as const;

let wired = false;

/** Liga foco do app, estado da rede e sessão ao React Query. Uma vez na abertura. */
export function wireQueryClient(): void {
  if (wired) return;
  wired = true;

  onlineManager.setEventListener((setOnline) => {
    const subscription = addNetworkStateListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => subscription.remove();
  });

  if (Platform.OS !== "web") {
    AppState.addEventListener("change", (status) => focusManager.setFocused(status === "active"));
  }

  onSessionChange((event) => {
    if (event.type === "signedOut") {
      // Remove (não só invalida): respostas "públicas" trazem dados da conta anterior
      // (myClaim com o código do cupom, isFavorite, resumo do mês) e ficariam no cache offline.
      queryClient.removeQueries({ queryKey: queryKeys.me.all });
      queryClient.removeQueries({ queryKey: queryKeys.all });
      return;
    }
    // Respostas públicas mudam com a conta (isFavorite, myClaim, earned…).
    void queryClient.invalidateQueries({ queryKey: queryKeys.all });
  });

  // Lojista saiu (ou a sessão dele venceu/perdeu o acesso): os números da loja somem da memória.
  useMerchantSession.subscribe((state, previous) => {
    if (previous.status === "signedIn" && state.status !== "signedIn") {
      queryClient.removeQueries({ queryKey: queryKeys.merchant.all });
    }
  });
}
