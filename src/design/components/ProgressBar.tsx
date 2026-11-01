import { memo, useEffect } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { easings } from "../easings";
import { useColors } from "../theme/ThemeProvider";

export type ProgressBarProps = {
  /** 0..1 */
  value: number;
  /** .bar = 6; .tk-progress = 8 */
  height?: number;
  /** Padrão: `onMediaLine` (branco translúcido sobre tom colorido). */
  trackColor?: string;
  /** Padrão: `onMedia` (branco). */
  fillColor?: string;
  /** Preenchimento em gradiente (90deg), como .tk-progress */
  gradient?: readonly [string, string];
  /** .bar i = 600ms ease; .tk-progress i = 1s linear */
  duration?: number;
  linear?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

type BackgroundImage = NonNullable<ViewStyle["backgroundImage"]>;

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * Barra de progresso arredondada (.bar / .tk-progress). Padrão: branca sobre tom colorido.
 * O preenchimento tem a largura toda e encolhe com `scaleX` a partir da esquerda: anima só
 * transform (UI thread, sem layout nem `onLayout`). Monta já no valor atual e só anima quando
 * `value` muda — uma lista rolando não "enche" as barras de novo.
 */
export const ProgressBar = memo(function ProgressBar({
  value,
  height = 6,
  trackColor,
  fillColor,
  gradient,
  duration = 600,
  linear = false,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const colors = useColors();
  const clamped = clamp01(value);
  const fill = useSharedValue(clamped);

  useEffect(() => {
    if (fill.get() === clamped) return;
    fill.set(withTiming(clamped, { duration, easing: linear ? Easing.linear : easings.ease }));
  }, [clamped, duration, linear, fill]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.get() }] }));
  const radius = height / 2;
  const backgroundImage: BackgroundImage | undefined = gradient
    ? [
        {
          type: "linear-gradient",
          direction: "90deg",
          colorStops: [{ color: gradient[0] }, { color: gradient[1] }],
        },
      ]
    : undefined;

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: radius, backgroundColor: trackColor ?? colors.onMediaLine },
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            borderRadius: radius,
            backgroundColor: gradient ? gradient[1] : (fillColor ?? colors.onMedia),
            backgroundImage,
          },
          animated,
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  track: { overflow: "hidden", alignSelf: "stretch" },
  fill: { ...StyleSheet.absoluteFill, transformOrigin: "left" },
});
