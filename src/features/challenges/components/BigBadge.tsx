import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  createStyles,
  cssAngle,
  easings,
  SealBadge,
  type SealBadgeSeal,
  useColors,
  useScreenFocused,
  withAlpha,
} from "@/design";

const SIZE = 196;
const SHINE_W = SIZE * 0.4;
const SHINE_DIR = cssAngle(90);

/** Selo grande da celebração (.big-badge): entra girando e um brilho passa por cima. */
export function BigBadge({ seal }: { seal: SealBadgeSeal }) {
  const colors = useColors();
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const focused = useScreenFocused();
  const enter = useSharedValue(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    // @keyframes badgein: scale(0) rotate(-40deg) → 1, 1 s na curva spring
    enter.set(withTiming(1, { duration: 1000, easing: easings.spring }));
  }, [enter]);

  useEffect(() => {
    if (reduceMotion || !focused) return;
    // @keyframes shine 2.8s, atraso 1s: anda em 40% do tempo e espera o resto
    shine.set(0);
    shine.set(
      withDelay(
        1000,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1120, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1680 }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(shine);
  }, [reduceMotion, focused, shine]);

  const enterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: enter.get() }, { rotate: `${-40 * (1 - enter.get())}deg` }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    // left: -60% → 140%
    transform: [{ translateX: -SIZE * 0.6 + shine.get() * SIZE * 2 }, { rotate: "20deg" }],
  }));

  return (
    <Animated.View style={[styles.wrap, enterStyle]}>
      <SealBadge seal={seal} size={SIZE} style={styles.badge} />
      <View style={styles.inset} pointerEvents="none" />
      {reduceMotion ? null : (
        <View style={styles.shineClip} pointerEvents="none">
          <Animated.View style={[styles.shine, shineStyle]}>
            <LinearGradient
              colors={[
                withAlpha(colors.onMedia, 0),
                withAlpha(colors.onMedia, 0.5),
                withAlpha(colors.onMedia, 0),
              ]}
              start={SHINE_DIR.start}
              end={SHINE_DIR.end}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { width: SIZE, height: SIZE, marginTop: 40 },
  badge: {
    // halos claros sobre o fundo `chrome` da celebração + sombra
    boxShadow: `0 0 0 10px ${withAlpha(t.colors.onChrome, 0.06)}, 0 0 0 22px ${withAlpha(t.colors.onChrome, 0.03)}, 0 30px 60px -10px ${withAlpha(t.colors.scrim, 0.6)}`,
  },
  inset: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE / 2,
    // volume do selo (sobre o gradiente dele)
    boxShadow: `inset 0 -10px 20px ${withAlpha(t.colors.scrim, 0.2)}, inset 0 8px 16px ${withAlpha(t.colors.onMedia, 0.35)}`,
  },
  shineClip: { ...StyleSheet.absoluteFill, borderRadius: SIZE / 2, overflow: "hidden" },
  shine: { position: "absolute", top: -SIZE * 0.5, left: 0, width: SHINE_W, height: SIZE * 2 },
}));
