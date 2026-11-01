import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { createStyles, easings, Icon, useColors, useScreenFocused, withAlpha } from "@/design";

export type ViewfinderProps = {
  /** .vf = 250 (encolhe para 200 no "ok") */
  size: number;
  ok: boolean;
};

const RADIUS = 34;
const CORNER = 50;
const BORDER = 5;
/** box-shadow: 0 0 0 999px rgba(0,0,0,.5): borda enorme em volta do furo arredondado. */
const DIM = 999;
const OK_SCALE = 200 / 250;

/** Visor do leitor (.vf): escurece em volta, cantos, linha que varre e o check do "ok". */
export function Viewfinder({ size, ok }: ViewfinderProps) {
  const colors = useColors();
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const focused = useScreenFocused();
  const scale = useSharedValue(1);
  const sweep = useSharedValue(0);

  useEffect(() => {
    scale.set(withTiming(ok ? OK_SCALE : 1, { duration: 400, easing: easings.spring }));
  }, [ok, scale]);

  useEffect(() => {
    if (ok || reduceMotion || !focused) {
      cancelAnimation(sweep);
      sweep.set(0.5);
      return;
    }
    sweep.set(0);
    // @keyframes scanline: 22px → (size − 28) → 22px em 2,2 s
    sweep.set(
      withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    return () => cancelAnimation(sweep);
  }, [ok, reduceMotion, focused, sweep]);

  const frame = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const travel = size - 50;
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: sweep.get() * travel }] }));

  // sobre a imagem da câmera: branco nos dois temas
  const cornerColor = ok ? colors.brand : colors.onMedia;

  return (
    <Animated.View
      style={[{ width: size, height: size }, frame]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.dim,
          {
            left: -DIM,
            top: -DIM,
            width: size + DIM * 2,
            height: size + DIM * 2,
            borderRadius: RADIUS + DIM,
          },
        ]}
      />
      <View style={[styles.cn, styles.tl, { borderColor: cornerColor }]} />
      <View style={[styles.cn, styles.tr, { borderColor: cornerColor }]} />
      <View style={[styles.cn, styles.bl, { borderColor: cornerColor }]} />
      <View style={[styles.cn, styles.br, { borderColor: cornerColor }]} />
      {ok ? (
        <View style={styles.okWrap}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.okDot}>
            <Icon name="check" size={42} color={colors.onBrand} strokeWidth={2.5} />
          </Animated.View>
        </View>
      ) : (
        <Animated.View style={[styles.line, line]} />
      )}
    </Animated.View>
  );
}

const useStyles = createStyles((t) => ({
  dim: {
    position: "absolute",
    borderWidth: DIM,
    borderColor: withAlpha(t.colors.scrim, 0.5),
  },
  cn: { position: "absolute", width: CORNER, height: CORNER, borderWidth: 0 },
  tl: {
    top: -3,
    left: -3,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderTopLeftRadius: RADIUS,
  },
  tr: {
    top: -3,
    right: -3,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
    borderTopRightRadius: RADIUS,
  },
  bl: {
    bottom: -3,
    left: -3,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
    borderBottomLeftRadius: RADIUS,
  },
  br: {
    bottom: -3,
    right: -3,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomRightRadius: RADIUS,
  },
  line: {
    position: "absolute",
    top: 22,
    left: 18,
    right: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: t.colors.brand,
    boxShadow: `0 0 18px 4px ${withAlpha(t.colors.brand, 0.7)}`,
  },
  okWrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  okDot: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
}));
