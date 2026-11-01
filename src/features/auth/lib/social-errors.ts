import type { SocialProvider } from "@/contracts/app/auth";
import { isApiError } from "@/core/api/errors";

/*
 * Recusas do POST /auth/social traduzidas para o que a tela faz. Uma conta =
 * um método de entrada (senha, Google ou Apple); a API não vincula métodos.
 */

/** Como a conta existente entra. */
export type AccountMethod = "password" | SocialProvider;

export type SocialFailure =
  /** Conta nova: mostrar os termos e reenviar com `acceptTerms: true`. */
  | { kind: "terms" }
  /** E-mail já tem conta com outro método. */
  | { kind: "other-login"; method: AccountMethod }
  /** O token do provedor não foi aceito. */
  | { kind: "invalid" }
  /** Conta bloqueada (mensagem da API). */
  | { kind: "blocked"; message: string }
  /** Provedor não configurado no ERP ou fora do ar. */
  | { kind: "unavailable" }
  | { kind: "rate-limited" }
  | { kind: "other" };

export const PROVIDER_LABEL: Record<SocialProvider, string> = { google: "Google", apple: "Apple" };

const METHODS: readonly AccountMethod[] = ["password", "google", "apple"];

const isMethod = (value: unknown): value is AccountMethod =>
  typeof value === "string" && (METHODS as readonly string[]).includes(value);

/** `details.provider` do 409 (ou, por garantia, `fieldErrors.provider[0]`). */
export function accountMethodOf(error: unknown): AccountMethod | null {
  if (!isApiError(error)) return null;
  const { details } = error;
  if (details && typeof details === "object" && "provider" in details) {
    const { provider } = details as { provider: unknown };
    if (isMethod(provider)) return provider;
  }
  const fromFields = error.fieldErrors?.provider?.[0];
  return isMethod(fromFields) ? fromFields : null;
}

export function socialFailure(error: unknown): SocialFailure {
  if (!isApiError(error)) return { kind: "other" };
  switch (error.code) {
    case "TERMS_REQUIRED":
      return { kind: "terms" };
    case "EMAIL_USES_OTHER_LOGIN": {
      const method = accountMethodOf(error);
      return method ? { kind: "other-login", method } : { kind: "other" };
    }
    case "INVALID_CREDENTIALS":
      return { kind: "invalid" };
    case "FORBIDDEN":
      return { kind: "blocked", message: error.message };
    case "SERVICE_UNAVAILABLE":
      return { kind: "unavailable" };
    case "RATE_LIMITED":
      return { kind: "rate-limited" };
    default:
      return { kind: "other" };
  }
}

/** Decodifica base64url para texto (sem validar nada: só para ler um claim). */
function decodeBase64Url(part: string): string {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  // %XX por byte + decodeURIComponent = UTF-8 sem depender de TextDecoder.
  let escaped = "";
  for (let i = 0; i < binary.length; i++) {
    escaped += `%${binary.charCodeAt(i).toString(16).padStart(2, "0")}`;
  }
  return decodeURIComponent(escaped);
}

/**
 * E-mail do id_token (claim `email`), para preencher o "Entrar" quando o
 * e-mail já tem conta com senha. Não é verificação: quem valida é a API.
 */
export function idTokenEmail(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(decodeBase64Url(payload));
    if (claims && typeof claims === "object" && "email" in claims) {
      const { email } = claims as { email: unknown };
      if (typeof email === "string" && email.includes("@")) return email.trim().toLowerCase();
    }
  } catch {
    // token malformado: sem e-mail
  }
  return null;
}
