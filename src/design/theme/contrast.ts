/* Contraste WCAG 2.x entre duas cores. Cor translúcida é composta sobre o fundo antes da
   medida (o fundo, se translúcido, é composto sobre branco). */
import { parseColor, type Rgba } from "./color";

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Composição "source over": `top` com seu alfa sobre `bottom` opaco. */
function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3];
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ];
}

function parseOrThrow(color: string): Rgba {
  const rgba = parseColor(color);
  if (!rgba) throw new Error(`Cor inválida para contraste: ${color}`);
  return rgba;
}

/** Luminância relativa (0 = preto, 1 = branco) de uma cor opaca. */
export function relativeLuminance(color: string): number {
  const [r, g, b] = over(parseOrThrow(color), [255, 255, 255, 1]);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Razão de contraste (1..21) do texto `fg` sobre o fundo `bg`. AA: 4.5 para texto normal,
 * 3 para texto grande (≥ 18.66 px bold / 24 px) e componentes de interface.
 */
export function contrastRatio(fg: string, bg: string): number {
  const base = over(parseOrThrow(bg), [255, 255, 255, 1]);
  const top = over(parseOrThrow(fg), base);
  const lum = (c: Rgba) => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
  const a = lum(top);
  const b = lum(base);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
