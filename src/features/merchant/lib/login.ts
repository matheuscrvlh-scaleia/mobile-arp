/* Recusas do login do lojista. Puro. (A espera depois de um 429 é de @/shared/lib/rate-limit.) */
import { isApiError } from "@/core/api/errors";

/** Aviso do formulário para as recusas conhecidas do login; null = outro erro. */
export function loginAlert(error: unknown): string | null {
  if (!isApiError(error)) return null;
  switch (error.code) {
    // genérico de propósito (inclusive usuário desativado)
    case "INVALID_CREDENTIALS":
      return "E-mail ou senha incorretos. Confira e tente de novo.";
    // senha certa, mas sem `coupons.redeem` ou sem loja
    case "FORBIDDEN":
      return "Este usuário não tem acesso ao caixa de nenhuma loja.";
    default:
      return null;
  }
}
