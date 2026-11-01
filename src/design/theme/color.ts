/* Utilitários puros de cor (sem React Native): usados pelas paletas, pelo contraste e pelos
   componentes. */

/** [r, g, b, a] com r/g/b em 0..255 e a em 0..1. */
export type Rgba = [number, number, number, number];

/** Lê `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` e `rgba()`. Outra coisa → null. */
export function parseColor(color: string): Rgba | null {
  const c = color.trim();
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((ch) => ch + ch).join("");
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) return null;
    const n = (i: number) => Number.parseInt(hex.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), hex.length === 8 ? n(6) / 255 : 1];
  }
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(c);
  if (!m) return null;
  const alpha =
    m[4] === undefined ? 1 : m[4].endsWith("%") ? Number.parseFloat(m[4]) / 100 : Number(m[4]);
  return [Number(m[1]), Number(m[2]), Number(m[3]), alpha];
}

/**
 * Cor com transparência: `withAlpha(colors.brand, 0.3)` → `rgba(88, 192, 105, 0.3)`.
 * Aceita `#rgb`, `#rrggbb`, `#rrggbbaa` e `rgb()/rgba()` (o alfa existente é multiplicado).
 * Cor que não entende volta igual.
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.min(1, Math.max(0, alpha));
  const rgba = parseColor(color);
  if (!rgba) return color;
  const [r, g, b, base] = rgba;
  return `rgba(${r}, ${g}, ${b}, ${Math.round(base * a * 1000) / 1000})`;
}

type GradientPoints = { start: { x: number; y: number }; end: { x: number; y: number } };

/**
 * Converte o ângulo de um `linear-gradient(<deg>)` do CSS em start/end do expo-linear-gradient.
 * Exato para caixas quadradas; em retângulos fica muito próximo.
 */
export function cssAngle(deg: number): GradientPoints {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(dx) + Math.abs(dy)) / 2;
  return {
    start: { x: 0.5 - dx * half, y: 0.5 - dy * half },
    end: { x: 0.5 + dx * half, y: 0.5 + dy * half },
  };
}
