/* Regras puras do resultado da leitura do QR: o que fazer com cada falha e os textos das recusas. */
import type { Challenges } from "@/contracts/app/challenges";
import { isApiError } from "@/core/api/errors";
import type { IconName } from "@/design";
import type { ThemeColor } from "@/design/theme/palettes";
import { allQrDone } from "./progress";

export type ScanRefusal = "expired" | "duplicate" | "allDone" | "invalid";

/**
 * Falha da leitura:
 * - `refusal`: a API recusou o QR (painel próprio; repetir não adianta);
 * - `rateLimited`: 429, trava a leitura por `retryAfterSec`;
 * - `transient`: rede, tempo, servidor… vale tentar de novo, mas só por um toque do visitante.
 */
export type ScanFailure =
  | { kind: "refusal"; refusal: ScanRefusal }
  | { kind: "rateLimited"; retryAfterSec: number }
  | { kind: "transient" };

/** Sem Retry-After, espera o mesmo que a janela do limite (30 leituras/min) sugere. */
export const DEFAULT_RETRY_AFTER_SEC = 30;

/** Código de erro da API → tipo de recusa (null = falha comum, ex.: rede). */
export function scanRefusal(
  error: unknown,
  challenges: Pick<Challenges, "challenges"> | undefined,
): ScanRefusal | null {
  if (!isApiError(error)) return null;
  switch (error.code) {
    case "QR_EXPIRED":
      return "expired";
    case "SEAL_ALREADY_EARNED":
      return allQrDone(challenges) ? "allDone" : "duplicate";
    case "QR_INVALID":
      return "invalid";
    default:
      return null;
  }
}

export function scanFailure(
  error: unknown,
  challenges: Pick<Challenges, "challenges"> | undefined,
): ScanFailure {
  const refusal = scanRefusal(error, challenges);
  if (refusal) return { kind: "refusal", refusal };
  if (isApiError(error) && (error.status === 429 || error.code === "RATE_LIMITED")) {
    return {
      kind: "rateLimited",
      retryAfterSec: Math.ceil(error.retryAfter ?? DEFAULT_RETRY_AFTER_SEC),
    };
  }
  return { kind: "transient" };
}

/** "Tente de novo em 12s". */
export function retryInLabel(msLeft: number): string {
  return `Tente de novo em ${Math.max(1, Math.ceil(msLeft / 1000))}s`;
}

export type RefusalCopy = {
  icon: IconName;
  /** Nome da cor do tema (o painel resolve ao desenhar, acompanhando o tema). */
  iconBg: ThemeColor;
  iconColor: ThemeColor;
  title: string;
  text: string;
};

export function refusalCopy(kind: ScanRefusal): RefusalCopy {
  switch (kind) {
    case "expired":
      return {
        icon: "clock-alert",
        iconBg: "dangerSoft",
        iconColor: "dangerText",
        title: "Este QR Code expirou",
        text: "Ele é de um desafio que já terminou. O QR Code só vale enquanto o desafio está ativo.",
      };
    case "duplicate":
      return {
        icon: "copy-check",
        iconBg: "surface",
        iconColor: "text",
        title: "Você já ganhou este selo",
        text: "Cada QR Code dá o selo uma vez só por pessoa. Que tal partir para o próximo desafio?",
      };
    case "allDone":
      return {
        icon: "trophy",
        iconBg: "brand",
        iconColor: "onBrand",
        title: "Tudo feito este mês!",
        text: "Você já cumpriu todos os desafios com QR Code. Novos desafios chegam no mês que vem.",
      };
    case "invalid":
      return {
        icon: "circle-x",
        iconBg: "dangerSoft",
        iconColor: "dangerText",
        title: "QR Code inválido",
        text: "Este QR Code não é de um desafio da ARP ou não vale mais. Confira com a loja ou a equipe da ARP.",
      };
  }
}
