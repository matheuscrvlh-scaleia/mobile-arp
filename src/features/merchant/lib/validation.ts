/* Respostas do caixa: o que dizer ao lojista quando um código não pode ser usado. Puro. */
import type { MerchantClaim } from "@/contracts/app/merchant";
import { errorMessage, isApiError } from "@/core/api/errors";
import type { IconName } from "@/design";
import { dayTimeLabel } from "./overview";

/**
 * `sheet`: recusa definitiva (painel com ícone, título e texto).
 * `toast`: falha passageira (rede, servidor): um aviso curto e o lojista tenta de novo.
 */
export type ValidationFailure = {
  kind: "sheet" | "toast";
  icon: IconName;
  title: string;
  text: string;
};

const ALREADY_TEXT =
  "Cada código vale uma vez só. Se o cliente pegou o cupom de novo, o código novo está no app dele.";

/** "Este código já foi usado às 19:42" (ou "em 31/10 às 19:42"; sem hora, só a frase). */
export function alreadyUsedTitle(redeemedAt: string | null | undefined, now: number): string {
  if (!redeemedAt) return "Este código já foi usado";
  const when = dayTimeLabel(redeemedAt, now).replace(/^hoje /, "");
  return `Este código já foi usado ${when.startsWith("às") ? when : `em ${when}`}`;
}

const sheet = (icon: IconName, title: string, text: string): ValidationFailure => ({
  kind: "sheet",
  icon,
  title,
  text,
});

const already = (redeemedAt: string | null | undefined, now: number) =>
  sheet("copy-x", alreadyUsedTitle(redeemedAt, now), ALREADY_TEXT);

const EXPIRED = sheet(
  "clock-alert",
  "Este código venceu",
  "O prazo para usar acabou e a unidade voltou para a promoção. Se ainda houver cupons, o cliente pode pegar outro pelo app.",
);

const CANCELLED = sheet(
  "circle-minus",
  "Este código foi cancelado",
  "Ele não vale mais. Se ainda houver cupons, o cliente pode pegar outro pelo app.",
);

/** Recusa da API (lookup ou redeem) → mensagem. `redeemedAt` vem de uma consulta, se houver. */
export function failureFromError(
  error: unknown,
  { now, redeemedAt }: { now: number; redeemedAt?: string | null },
): ValidationFailure {
  const code = isApiError(error) ? error.code : null;
  switch (code) {
    case "NOT_FOUND":
      return sheet(
        "search-x",
        "Código não encontrado",
        "Confira com o cliente: o código está no ticket do cupom, embaixo do QR Code.",
      );
    case "CLAIM_ALREADY_REDEEMED":
      return already(redeemedAt, now);
    case "CLAIM_EXPIRED":
      return EXPIRED;
    case "CLAIM_CANCELLED":
      return CANCELLED;
    case "CLAIM_WRONG_STORE":
      return sheet(
        "store",
        "Este cupom é de outra loja",
        "Ele só pode ser usado na loja da promoção. Confira no ticket do cliente o nome da loja.",
      );
    case "CLAIM_WRONG_DAY":
      // A API diz os dias ("Recusado: este cupom só vale seg, ter…").
      return sheet(
        "calendar-days",
        isApiError(error) ? error.message : "Hoje não é dia deste cupom",
        "O lojista escolheu os dias em que o cupom vale. O cliente pode usar num desses dias, dentro do prazo.",
      );
    case "VALIDATION_ERROR":
      return sheet(
        "circle-alert",
        "Código inválido",
        "O código tem o formato ARP-XXXXXX: seis letras ou números depois de ARP-.",
      );
    case "FORBIDDEN":
      return sheet(
        "lock",
        "Sem acesso a esta loja",
        "Seu usuário não pode validar cupons desta loja. Fale com a administração da ARP.",
      );
    default:
      return { kind: "toast", icon: "circle-alert", title: errorMessage(error), text: "" };
  }
}

/**
 * Consulta que voltou com o pego, mas ele não pode mais ser usado (já usado, vencido,
 * cancelado ou com o prazo acabando agora). null = pode confirmar o uso.
 */
export function claimProblem(
  claim: Pick<MerchantClaim, "status" | "expiresAt" | "redeemedAt">,
  now: number,
): ValidationFailure | null {
  switch (claim.status) {
    case "redeemed":
      return already(claim.redeemedAt, now);
    case "expired":
      return EXPIRED;
    case "cancelled":
      return CANCELLED;
    case "active":
      return Date.parse(claim.expiresAt) <= now ? EXPIRED : null;
  }
}
