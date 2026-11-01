import { SECOND_MS } from "@/shared/lib/time";

/** Código de recuperação de senha (e-mail): 6 dígitos, vale uma vez. */
export const RESET_CODE_LENGTH = 6;

/** 503 do ERP (envio de e-mail não configurado ou fora do ar). */
export const RESET_UNAVAILABLE =
  "Recuperação indisponível no momento. Tente mais tarde ou fale com o atendimento da ARP.";

/** Espera para pedir outro código. */
export const RESEND_WAIT_MS = 60 * SECOND_MS;

/**
 * Só os dígitos, no máximo 6. Aceita o código colado com espaço, hífen ou
 * texto em volta ("Seu código é: 123 456").
 */
export function cleanResetCode(text: string): string {
  return text.replace(/\D/g, "").slice(0, RESET_CODE_LENGTH);
}

/** Segundos que faltam até `until` (arredondado para cima; 0 = já pode). */
export function secondsLeft(until: number | null, now: number): number {
  if (until === null || until <= now) return 0;
  return Math.ceil((until - now) / SECOND_MS);
}

/** "0:45" */
export function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
