import { useState } from "react";
import { useNow } from "@/shared/hooks/useNow";
import { rateLimitedUntil, rateLimitMessage } from "@/shared/lib/rate-limit";
import { MINUTE_MS, SECOND_MS } from "@/shared/lib/time";

/**
 * Espera depois de um 429 num formulário: `block(error)` liga a espera (true se era 429),
 * `message` diz quanto falta e `blocked` desliga o botão. O relógio só bate por segundo
 * enquanto há espera.
 */
export function useRateLimit() {
  const [until, setUntil] = useState<number | null>(null);
  const now = useNow(until === null ? MINUTE_MS : SECOND_MS);
  const message = rateLimitMessage(until, now);

  const block = (error: unknown): boolean => {
    const next = rateLimitedUntil(error, Date.now());
    if (next === null) return false;
    setUntil(next);
    return true;
  };

  return { blocked: message !== null, message, block };
}
