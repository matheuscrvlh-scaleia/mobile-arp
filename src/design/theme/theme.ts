/* Objeto de tema por esquema: criado uma vez por módulo, sempre a mesma referência
   (é o valor do contexto e a chave do cache do createStyles). Puro, sem React. */
import type { Tone } from "@/contracts";
import {
  type Gradients,
  type Palette,
  paletteShadows,
  palettes,
  paletteTones,
  type Shadows,
  type ThemeColor,
  type ThemeScheme,
  type ToneSpec,
  themeGradients,
} from "./palettes";

export type Theme = {
  scheme: ThemeScheme;
  /** `scheme === "dark"` */
  dark: boolean;
  colors: Palette;
  tones: Record<Tone, ToneSpec>;
  /** Tom vindo da API (pode ser nulo em eventos sem foto) → spec, com `green` de reserva. */
  toneOf: (tone: Tone | null | undefined) => ToneSpec;
  gradients: Gradients;
  shadows: Shadows;
};

function build(scheme: ThemeScheme): Theme {
  const tones = paletteTones[scheme];
  return {
    scheme,
    dark: scheme === "dark",
    colors: palettes[scheme],
    tones,
    toneOf: (tone) => (tone ? tones[tone] : undefined) ?? tones.green,
    gradients: themeGradients,
    shadows: paletteShadows[scheme],
  };
}

export const themes: Record<ThemeScheme, Theme> = { light: build("light"), dark: build("dark") };

/**
 * Cor do tema por nome (`"inverse"`) ou cor crua (`"#58c069"`). Para APIs chamadas fora do
 * React, como `sheet.message({ iconBackground: "inverse" })`, que só resolvem a cor na hora de
 * desenhar.
 */
export function resolveColor(colors: Palette, value: ThemeColor | (string & {})): string {
  return Object.hasOwn(colors, value) ? colors[value as ThemeColor] : value;
}
