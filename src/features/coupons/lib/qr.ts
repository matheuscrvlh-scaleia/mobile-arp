/* Matriz do QR → caminho SVG (sem React). */
import QRCode from "qrcode";

/** Margem branca obrigatória em volta (em módulos): o leitor do caixa precisa dela. */
export const QR_QUIET_ZONE = 2;

/** Módulos do QR do código (correção de erro "M"): `data[row * size + col]` é 1 no módulo escuro. */
export function qrModules(value: string): { data: ArrayLike<number>; size: number } {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  return { data: modules.data, size: modules.size };
}

/** Lado do QR em módulos, já com a margem dos dois lados. */
export function qrBoxModules(size: number, quiet = QR_QUIET_ZONE): number {
  return size + quiet * 2;
}

/**
 * Menor lado em pixels ≥ `minPx` que dá um número inteiro de pixels por módulo:
 * sem módulo "meio pixel", as bordas ficam nítidas e o leitor do caixa lê de primeira.
 */
export function crispQrPixels(boxModules: number, minPx: number): number {
  return Math.ceil(minPx / boxModules) * boxModules;
}

/**
 * Um subcaminho por sequência horizontal de módulos escuros (`M x y h n v1 h -n z`),
 * deslocado pela margem `quiet`. `data[row * size + col]` é 1 no módulo escuro.
 */
export function qrPath(data: ArrayLike<number>, size: number, quiet: number): string {
  const parts: string[] = [];
  for (let row = 0; row < size; row += 1) {
    let col = 0;
    while (col < size) {
      if (!data[row * size + col]) {
        col += 1;
        continue;
      }
      const start = col;
      while (col < size && data[row * size + col]) col += 1;
      const run = col - start;
      parts.push(`M${start + quiet} ${row + quiet}h${run}v1h-${run}z`);
    }
  }
  return parts.join("");
}
