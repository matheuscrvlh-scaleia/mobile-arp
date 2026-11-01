import { useEffect } from "react";
import {
  type DimensionValue,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  makeMutable,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "../theme/ThemeProvider";
import { radii } from "../tokens";
import { useScreenFocused } from "../useScreenFocused";

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  /** Fundo do bloco (padrão `skeleton`); sobre `surface`, use `surfaceStrong`. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/* Um pulso só para o app inteiro: todos os blocos piscam juntos (como uma animação CSS
   única) e há no máximo uma animação rodando, não uma por bloco. Liga com o primeiro bloco
   visível e desliga com o último. */
let pulse: SharedValue<number> | null = null;
let pulseUsers = 0;

function pulseValue(): SharedValue<number> {
  pulse ??= makeMutable(1);
  return pulse;
}

function retainPulse(): () => void {
  const sv = pulseValue();
  pulseUsers += 1;
  if (pulseUsers === 1) {
    sv.set(
      withRepeat(withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }
  return () => {
    pulseUsers -= 1;
    if (pulseUsers > 0) return;
    cancelAnimation(sv);
    sv.set(1);
  };
}

/**
 * Bloco "carregando" pulsando (opacidade 1 ↔ .5). Parado com movimento reduzido e quando a
 * tela perde o foco.
 */
export function Skeleton({ width = "100%", height = 14, radius = 8, color, style }: SkeletonProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const focused = useScreenFocused();
  const animate = focused && !reduceMotion;
  const sv = pulseValue();

  useEffect(() => {
    if (!animate) return;
    return retainPulse();
  }, [animate]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: animate ? sv.get() : 1 }), [animate, sv]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: color ?? colors.skeleton },
        pulseStyle,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export type SkeletonTextProps = {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  /** Largura da última linha */
  lastWidth?: DimensionValue;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  gap = 8,
  lastWidth = "60%",
  color,
  style,
}: SkeletonTextProps) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: linhas fixas, sem reordenação
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastWidth : "100%"}
          radius={lineHeight / 2}
          color={color}
        />
      ))}
    </View>
  );
}

export type SkeletonCardProps = {
  /** .cp min-height = 168 */
  height?: DimensionValue;
  width?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Cartão inteiro carregando, com linhas de texto sugeridas por cima. */
export function SkeletonCard({
  height = 168,
  width = "100%",
  radius = radii.card,
  style,
}: SkeletonCardProps) {
  const colors = useColors();
  return (
    <View style={[{ height, width }, style]}>
      <Skeleton width="100%" height="100%" radius={radius} />
      <View style={styles.inner}>
        <Skeleton width={110} height={12} color={colors.surfaceStrong} />
        <Skeleton width={150} height={30} radius={10} color={colors.surfaceStrong} />
        <Skeleton width="55%" height={12} color={colors.surfaceStrong} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { ...StyleSheet.absoluteFill, padding: 18, gap: 12 },
});
