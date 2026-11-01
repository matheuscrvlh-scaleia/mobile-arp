/* Situação de um pego: o que cada status mostra no bilhete e na carteira (sem React). */
import type { Claim, WalletStatus, WalletTab } from "@/contracts/app/coupons";
import type { IconName, PillVariant } from "@/design";
import { formatDayMonth } from "@/shared/lib/format";

export type StatusTone = "brand" | "clay";

export type ClaimStatusSpec = {
  /** Rótulo do rodapé do bilhete ("Use em até", "Usado"…). */
  label: string;
  /** Ícone do rodapé do bilhete. */
  icon: IconName;
  /** Cor do ícone do rodapé e do carimbo. */
  tone: StatusTone;
  /** Carimbo sobre o QR (o ativo não tem). */
  stamp: { text: string; icon?: IconName } | null;
  /** Etiqueta da carteira (o ativo mostra o contador no lugar). */
  pill: { label: string; icon: IconName; variant: PillVariant } | null;
  /** Aba da carteira em que o pego aparece. */
  tab: WalletTab;
};

/**
 * Um registro por status: um status novo no contrato não compila até ganhar o seu
 * (nada cai calado em "expirado").
 */
export const CLAIM_STATUS: Record<WalletStatus, ClaimStatusSpec> = {
  active: {
    label: "Use em até",
    icon: "timer",
    tone: "brand",
    stamp: null,
    pill: null,
    tab: "active",
  },
  used: {
    label: "Usado",
    icon: "party-popper",
    tone: "brand",
    stamp: { text: "USADO", icon: "check" },
    pill: { label: "Usado", icon: "check", variant: "brand" },
    tab: "used",
  },
  expired: {
    label: "Prazo encerrado",
    icon: "rotate-ccw",
    tone: "clay",
    stamp: { text: "VENCIDO" },
    pill: { label: "Voltou para a promoção", icon: "rotate-ccw", variant: "clay" },
    tab: "expired",
  },
  cancelled: {
    label: "Cancelado",
    icon: "circle-x",
    tone: "clay",
    stamp: { text: "CANCELADO" },
    pill: { label: "Cancelado pela loja", icon: "circle-x", variant: "default" },
    tab: "expired",
  },
};

/** Ativo com prazo vencido aparece como expirado, igual à API (útil offline). */
export function effectiveStatus(
  claim: Pick<Claim, "status" | "expiresAt">,
  now: number,
): WalletStatus {
  if (claim.status === "active" && Date.parse(claim.expiresAt) <= now) return "expired";
  return claim.status;
}

/** Texto da etiqueta da carteira; o usado ganha a data ("Usado em 12/10"). */
export function pillLabel(claim: Pick<Claim, "redeemedAt">, status: WalletStatus): string | null {
  const pill = CLAIM_STATUS[status].pill;
  if (!pill) return null;
  if (status === "used" && claim.redeemedAt) return `Usado em ${formatDayMonth(claim.redeemedAt)}`;
  return pill.label;
}
