import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import type { Tone } from "@/contracts";
import { withAlpha } from "../theme/color";
import type { ThemeScheme, ToneSpec } from "../theme/palettes";
import { useTheme } from "../theme/ThemeProvider";
import type { Theme } from "../theme/theme";

export type ToneSurfaceProps = {
  tone: Tone | null | undefined;
  children?: ReactNode;
  /** 135deg no CSS dos tons */
  angle?: number;
  style?: StyleProp<ViewStyle>;
};

type BackgroundImage = Exclude<NonNullable<ViewStyle["backgroundImage"]>, string>;
type ToneStyle = Pick<ViewStyle, "backgroundColor" | "boxShadow"> & {
  backgroundImage: BackgroundImage;
};

/* Um estilo por tema+tom+ângulo, criado uma vez: a mesma referência entre renders e entre
   cartões (o RN não reprocessa o fundo quando a prop não muda). */
const cache = new Map<string, ToneStyle>();

function layersFor(spec: ToneSpec, angle: number): BackgroundImage {
  const layers: BackgroundImage[number][] = [];
  if (spec.radialGlow) {
    // radial-gradient(circle at 90% 0%, <glow>, transparent 50%) — fica por cima do linear
    layers.push({
      type: "radial-gradient",
      shape: "circle",
      size: "farthest-corner",
      position: { left: "90%", top: "0%" },
      colorStops: [
        { color: spec.radialGlow, positions: ["0%"] },
        { color: withAlpha(spec.radialGlow, 0), positions: ["50%"] },
      ],
    });
  }
  layers.push({
    type: "linear-gradient",
    direction: `${angle}deg`,
    colorStops: [{ color: spec.gradient[0] }, { color: spec.gradient[1] }],
  });
  return layers;
}

function toneStyle(theme: Theme, tone: Tone | null | undefined, angle: number): ToneStyle {
  const scheme: ThemeScheme = theme.scheme;
  const key = `${scheme}:${tone ?? ""}:${angle}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const spec = theme.toneOf(tone);
  const style: ToneStyle = {
    // cor sólida de reserva por baixo do gradiente
    backgroundColor: spec.gradient[1],
    backgroundImage: layersFor(spec, angle),
    // fio interno: o tom escuro não some no fundo quase preto do tema escuro
    ...(spec.border ? { boxShadow: `inset 0 0 0 1px ${spec.border}` } : null),
  };
  cache.set(key, style);
  return style;
}

/**
 * Fundo de um tom de cartão (.tone-*), com o `backgroundImage` nativo do RN (linear + radial,
 * mesma sintaxe do CSS) — sem SVG nem view extra. Use `useTheme().toneOf(tone)` para as cores
 * do conteúdo (no tema escuro o `sand` vira areia escura com texto claro).
 */
export function ToneSurface({ tone, children, angle, style }: ToneSurfaceProps) {
  const theme = useTheme();
  return <View style={[styles.clip, toneStyle(theme, tone, angle ?? 135), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
});
