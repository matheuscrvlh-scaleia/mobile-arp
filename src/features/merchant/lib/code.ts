/* Código do cupom no caixa (ARP-XXXXXX): o que o lojista digita, cola ou lê no QR. Puro. */
import { COUPON_CODE_PATTERN } from "@/contracts/promotions";

export const CODE_PREFIX = "ARP-";
/** Letras/números depois de "ARP-". */
export const CODE_BODY_LENGTH = 6;

/**
 * O que fica no campo, depois do "ARP-" fixo: maiúsculas, só letras e números, até 6.
 * Colar o código inteiro funciona com ou sem hífen ("arp-4hxp2k", "ARP4HXP2K", " ARP 4HXP2K "),
 * inclusive por cima de um começo já digitado ("4H" + "ARP-4HXP2K").
 * Com 6 caracteres ou menos o texto é sempre o corpo (o corpo pode começar com "ARP").
 */
export function codeBody(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length <= CODE_BODY_LENGTH) return s;
  // o último "ARP" que ainda tem um corpo inteiro depois dele
  for (let i = s.length - CODE_BODY_LENGTH - 3; i >= 0; i -= 1) {
    if (s.startsWith("ARP", i)) return s.slice(i + 3, i + 3 + CODE_BODY_LENGTH);
  }
  // digitou o "ARP" no campo e seguiu digitando
  if (s.startsWith("ARP")) return s.slice(3, 3 + CODE_BODY_LENGTH);
  return s.slice(0, CODE_BODY_LENGTH);
}

/** Aviso do campo quando o código está incompleto (antes de consultar a API). */
export const INCOMPLETE_CODE = "Código inválido: são 6 letras ou números depois de ARP-.";

/** Corpo do campo → código completo ("4HXP2K" → "ARP-4HXP2K"). */
export const fullCode = (body: string): string => `${CODE_PREFIX}${body}`;

/** O corpo forma um código no formato do contrato (couponCodeSchema). */
export const isCompleteBody = (body: string): boolean => COUPON_CODE_PATTERN.test(fullCode(body));

/** Valor lido no QR do ticket (é o próprio código). null = o QR não é de um cupom ARP. */
export function codeFromScan(data: string): string | null {
  const s = data.trim().toUpperCase();
  return COUPON_CODE_PATTERN.test(s) ? s : null;
}
