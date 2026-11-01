import type { ErrorCode } from "@/contracts/common";

/** Códigos do contrato + falhas do lado do app (sem resposta da API). */
export type AppErrorCode = ErrorCode | "NETWORK_ERROR" | "TIMEOUT" | "UNKNOWN";

/**
 * Erro de qualquer chamada à API. `message` já vem pronta para o visitante
 * (a API responde em pt-BR); `fieldErrors` vem em VALIDATION_ERROR.
 */
export class ApiError extends Error {
  override readonly name = "ApiError";

  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string[]> | null = null,
    readonly requestId: string | null = null,
    /** Segundos sugeridos pela API (429/503 com Retry-After). */
    readonly retryAfter: number | null = null,
    /** `error.details` bruto da API (ex.: EMAIL_USES_OTHER_LOGIN → `{ provider }`). */
    readonly details: unknown = null,
  ) {
    super(message);
  }

  /** Sem conexão ou servidor fora: vale tentar de novo. */
  get isTransient(): boolean {
    return (
      this.code === "NETWORK_ERROR" ||
      this.code === "TIMEOUT" ||
      this.status === 429 ||
      this.status >= 500
    );
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** Mensagem curta para o visitante, com texto próprio para as falhas sem resposta. */
export function errorMessage(error: unknown, fallback = "Algo deu errado. Tente de novo."): string {
  if (!isApiError(error)) return fallback;
  switch (error.code) {
    case "NETWORK_ERROR":
      return "Sem conexão. Confira sua internet e tente de novo.";
    case "TIMEOUT":
      return "A ARP demorou para responder. Tente de novo.";
    case "RATE_LIMITED":
      return "Muitas tentativas seguidas. Espere um pouco e tente de novo.";
    case "INTERNAL_ERROR":
      return "Tivemos um problema do nosso lado. Tente de novo em instantes.";
    default:
      return error.message || fallback;
  }
}
