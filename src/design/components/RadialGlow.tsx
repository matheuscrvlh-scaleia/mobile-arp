import { memo } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { withAlpha } from "../tokens";

export type RadialGlowProps = {
  /** Cor do centro do brilho (hex ou rgb/rgba). */
  color: string;
  /** Opacidade no centro (multiplica o alfa de `color`). Padrão 1. */
  opacity?: number;
  /** Centro em fração da caixa (0..1), como `circle at X% Y%`. Padrão canto superior direito. */
  center?: { x: number; y: number };
  /** Raio em fração do MAIOR lado da caixa (círculo de verdade, não elipse). Padrão .9. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

type BackgroundImage = NonNullable<ViewStyle["backgroundImage"]>;

const DEFAULT_CENTER = { x: 0.9, y: 0 };

const pct = (f: number) => `${Math.round(f * 10000) / 100}%`;

/**
 * `radial-gradient(circle at X Y, <color>, transparent R)` cobrindo o pai (absoluteFill).
 * Usa o `backgroundImage` nativo do RN (iOS: CAGradientLayer; Android: shader do próprio
 * fundo da view), sem SVG: nada de bitmap do tamanho da view por cartão no Android.
 * O raio `{x: R%, y: R%}` com `shape: circle` resolve para `max(R·largura, R·altura)`.
 */
export const RadialGlow = memo(function RadialGlow({
  color,
  opacity,
  center,
  radius,
  style,
}: RadialGlowProps) {
  const c = center ?? DEFAULT_CENTER;
  const r = pct(Math.max(0.0001, radius ?? 0.9));
  const backgroundImage: BackgroundImage = [
    {
      type: "radial-gradient",
      shape: "circle",
      size: { x: r, y: r },
      position: { left: pct(c.x), top: pct(c.y) },
      colorStops: [
        { color: withAlpha(color, opacity ?? 1), positions: ["0%"] },
        // mesma cor com alfa 0 (o "transparent" puro puxa para preto no meio do caminho)
        { color: withAlpha(color, 0), positions: ["100%"] },
      ],
    },
  ];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.fill, { backgroundImage }, style]}
    />
  );
});

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, pointerEvents: "none" },
});
