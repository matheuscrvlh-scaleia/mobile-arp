/* Espera depois de um 429 (excesso de tentativas) em formulários. Puro. */
import { isApiError } from "@/core/api/errors";
import { MINUTE_MS, SECOND_MS } from "@/shared/lib/time";

/** Até quando (epoch ms) esperar depois deste erro; null se não é 429. Sem Retry-After: 1 min. */
export function rateLimitedUntil(error: unknown, now: number): number | null {
  if (!isApiError(error) || error.code !== "RATE_LIMITED") return null;
  return now + (error.retryAfter ? error.retryAfter * SECOND_MS : MINUTE_MS);
}

/** "Muitas tentativas seguidas. Tente de novo em 45 s." / "… em 2 min."; null = já pode. */
export function rateLimitMessage(until: number | null, now: number): string | null {
  if (until === null || until <= now) return null;
  const left = until - now;
  const wait =
    left < MINUTE_MS ? `${Math.ceil(left / SECOND_MS)} s` : `${Math.ceil(left / MINUTE_MS)} min`;
  return `Muitas tentativas seguidas. Tente de novo em ${wait}.`;
}
