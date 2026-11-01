import { useNow } from "@/shared/hooks/useNow";
import { SECOND_MS } from "@/shared/lib/time";
import { retryInLabel } from "../lib/scan-result";

/** "Tente de novo em Xs" (texto puro: vai dentro de um `Text`). Relógio só enquanto aparece. */
export function RetryCountdown({ until }: { until: number }) {
  const now = useNow(SECOND_MS);
  return <>{retryInLabel(until - now)}</>;
}
