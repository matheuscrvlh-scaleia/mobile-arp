/* Regras da imagem do cupom salva na galeria (sem React, sem módulo nativo). */
import type { Claim } from "@/contracts/app/coupons";
import { formatDayMonth, formatTime } from "@/shared/lib/format";

/** Largura de desenho da imagem (unidades), multiplicada por `snapshotUnit`. */
export const SNAPSHOT_BASE_WIDTH = 360;
/** Largura final da imagem em pixels, igual em qualquer aparelho. */
export const SNAPSHOT_WIDTH_PX = 1080;
/** Lado mínimo do QR na imagem: legível no leitor do caixa mesmo com a foto reduzida. */
export const SNAPSHOT_QR_MIN_PX = 640;

/**
 * Pontos de layout por unidade de desenho. A captura sai na escala do aparelho
 * (pixels = pontos × PixelRatio), então a imagem fica com `SNAPSHOT_WIDTH_PX` em qualquer tela.
 */
export function snapshotUnit(pixelRatio: number): number {
  return SNAPSHOT_WIDTH_PX / (pixelRatio * SNAPSHOT_BASE_WIDTH);
}

/** "Válido até 01/11 às 18:05" (hora local). */
export function validUntilLabel(expiresAt: string): string {
  return `Válido até ${formatDayMonth(expiresAt)} às ${formatTime(expiresAt)}`;
}

/** Texto do "Compartilhar" quando não dá para mandar a imagem (Android) ou junto com ela. */
export function ticketShareText(claim: Pick<Claim, "code" | "expiresAt" | "coupon" | "store">) {
  return [
    `Meu cupom ARP: ${claim.coupon.title}`,
    `Loja: ${claim.store.name}`,
    `Código: ${claim.code}`,
    validUntilLabel(claim.expiresAt),
  ].join("\n");
}

/** Nome do arquivo (Android usa como nome na galeria). Só letras, números e hífen. */
export function snapshotFileName(code: string): string {
  const safe = code.replace(/[^A-Za-z0-9-]/g, "").slice(0, 32);
  return safe ? `cupom-arp-${safe}-` : "cupom-arp-";
}

/** O iOS devolve caminho puro; a galeria e o Share esperam `file://`. */
export function toFileUri(path: string): string {
  return /^[a-z]+:\/\//i.test(path) ? path : `file://${path}`;
}
