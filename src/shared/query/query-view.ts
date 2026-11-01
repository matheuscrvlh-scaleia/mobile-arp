import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { isApiError } from "@/core/api/errors";

/*
 * Estado de tela de uma consulta, igual em todo o app:
 * - ready: há dado (mesmo velho, do cache offline) → mostra;
 * - loading: primeira busca → skeleton;
 * - offline: sem rede e sem cache (consulta pausada pelo onlineManager ou erro de rede);
 * - error: a API recusou/falhou → ErrorState com "Tentar de novo".
 * Atenção: sem rede o React Query PAUSA a consulta (fetchStatus "paused") em vez de
 * dar erro; olhar só `isError` deixa a tela no skeleton para sempre.
 */
export type QueryView = "ready" | "loading" | "offline" | "error";

interface QueryLike {
  data: unknown;
  status: "pending" | "error" | "success";
  fetchStatus: "fetching" | "paused" | "idle";
  error: unknown;
}

const isOfflineError = (error: unknown) =>
  isApiError(error) && (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT");

export function queryView(query: QueryLike): QueryView {
  if (query.data !== undefined) return "ready";
  if (query.status === "error") return isOfflineError(query.error) ? "offline" : "error";
  if (query.fetchStatus === "paused") return "offline";
  return "loading";
}

/** Online segundo o React Query (ligado ao expo-network em core/query). Reativo. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}
