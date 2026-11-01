import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { useColors, useScreenFocused, useSvgId } from "@/design";

const SIZE = 640;
const R = SIZE / 2;
/** repeating-conic-gradient(rgba(88,192,105,.16) 0 8deg, transparent 8deg 22deg) */
const RAY_DEG = 8;
const STEP_DEG = 22.5;
/** A máscara é "circle" farthest-corner da caixa: raio = R·√2. */
const FADE_R = R * Math.SQRT2;

function wedge(fromDeg: number, toDeg: number): string {
  const a = ((fromDeg - 90) * Math.PI) / 180;
  const b = ((toDeg - 90) * Math.PI) / 180;
  const p = (ang: number) =>
    `${(R + R * Math.cos(ang)).toFixed(2)} ${(R + R * Math.sin(ang)).toFixed(2)}`;
  return `M${R} ${R} L${p(a)} A${R} ${R} 0 0 1 ${p(b)} Z`;
}

const RAYS = Array.from({ length: Math.round(360 / STEP_DEG) }, (_, i) =>
  wedge(i * STEP_DEG, i * STEP_DEG + RAY_DEG),
).join(" ");

/**
 * Raios girando atrás do selo (.won .rays), com a máscara radial que some nas pontas.
 * O giro para fora de foco e com "reduzir movimento".
 */
export function SealRays({ top }: { top: number }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const focused = useScreenFocused();
  const fadeId = useSvgId("rayFade");
  const turn = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || !focused) return;
    // continua do ângulo em que parou
    const from = turn.get() % 360;
    turn.set(from);
    turn.set(withRepeat(withTiming(from + 360, { duration: 30_000, easing: Easing.linear }), -1));
    return () => cancelAnimation(turn);
  }, [reduceMotion, focused, turn]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));

  return (
    <Animated.View
      style={[styles.rays, { top }, spin]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          {/* mask: radial-gradient(circle, #000 20%, transparent 62%) */}
          <RadialGradient id={fadeId} cx={R} cy={R} r={FADE_R} gradientUnits="userSpaceOnUse">
            <Stop offset={0.2} stopColor={colors.brand} stopOpacity={0.16} />
            <Stop offset={0.62} stopColor={colors.brand} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={RAYS} fill={`url(#${fadeId})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rays: {
    position: "absolute",
    left: "50%",
    width: SIZE,
    height: SIZE,
    marginLeft: -R,
  },
});
