import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { createStyles, easings, useColors, useTheme, withAlpha } from "@/design";

/* Colagem da boas-vindas (.collage): 4 fotos inclinadas que entram em sequência
   (tilein .9s com mola, atraso de .08s entre elas) e o selo da marca (popin). */

/** Medidas do protótipo (tela de 390 de largura). */
const BASE_W = 390;
export const COLLAGE_BASE_H = 470;

type TileSpec = {
  source: ImageSource;
  l: number;
  t: number;
  w: number;
  h: number;
  r: number;
  delay: number;
};

const TILES: TileSpec[] = [
  {
    source: require("../../../../assets/images/festa.webp"),
    l: -40,
    t: 56,
    w: 220,
    h: 250,
    r: -6,
    delay: 0,
  },
  {
    source: require("../../../../assets/images/espaco.webp"),
    l: 196,
    t: 40,
    w: 240,
    h: 170,
    r: 5,
    delay: 80,
  },
  {
    source: require("../../../../assets/images/placa.jpg"),
    l: 196,
    t: 226,
    w: 176,
    h: 214,
    r: 3,
    delay: 160,
  },
  {
    source: require("../../../../assets/images/fachada.jpg"),
    l: -14,
    t: 322,
    w: 196,
    h: 150,
    r: -3,
    delay: 240,
  },
];

/** Selo: logo clara sobre quadrado escuro no tema claro; no escuro o selo inverte (claro). */
const LOGO_ON_DARK = require("../../../../assets/images/logo-escura.png");
const LOGO_ON_LIGHT = require("../../../../assets/images/logo.png");

function Tile({ spec, scale, offsetX }: { spec: TileSpec; scale: number; offsetX: number }) {
  const styles = useStyles();
  const { dark } = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(spec.delay, withTiming(1, { duration: 900, easing: easings.spring }));
  }, [p, reduced, spec.delay]);

  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.6),
    transform: [
      { translateY: (1 - p.value) * 40 },
      { scale: 0.9 + 0.1 * p.value },
      { rotate: `${spec.r}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          left: offsetX + spec.l * scale,
          top: spec.t * scale,
          width: spec.w * scale,
          height: spec.h * scale,
          borderRadius: 30 * scale,
        },
        animated,
      ]}
    >
      <Image source={spec.source} contentFit="cover" style={StyleSheet.absoluteFill} />
      {/* no escuro as fotos descem um pouco o brilho para não ofuscar a tela */}
      {dark ? <View style={styles.veil} /> : null}
    </Animated.View>
  );
}

function BadgeLogo() {
  const styles = useStyles();
  const { dark } = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(500, withTiming(1, { duration: 800, easing: easings.spring }));
  }, [p, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 3),
    transform: [{ scale: 0.4 + 0.6 * p.value }],
  }));

  return (
    <Animated.View
      style={[styles.badge, animated]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="ARP"
    >
      {dark ? (
        <Image source={LOGO_ON_LIGHT} contentFit="contain" style={styles.logoOnLight} />
      ) : (
        <Image source={LOGO_ON_DARK} contentFit="cover" style={styles.logo} />
      )}
    </Animated.View>
  );
}

export type WelcomeCollageProps = { width: number; height: number };

export function WelcomeCollage({ width, height }: WelcomeCollageProps) {
  // Encaixa a colagem do protótipo na tela (aparelho estreito ou baixo), centralizada.
  const scale = Math.min(width / BASE_W, height / COLLAGE_BASE_H);
  const offsetX = (width - BASE_W * scale) / 2;
  const colors = useColors();
  const styles = useStyles();
  // linear-gradient(to top, <fundo> 15%, transparent): funde a colagem no fundo da página
  const fade = [withAlpha(colors.bg, 0), colors.bg] as const;
  return (
    <View
      style={[styles.collage, { height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {TILES.map((spec) => (
        <Tile key={spec.delay} spec={spec} scale={scale} offsetX={offsetX} />
      ))}
      <LinearGradient
        colors={fade}
        locations={[0, 0.85]}
        style={styles.fade}
        pointerEvents="none"
      />
      <BadgeLogo />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  collage: { overflow: "hidden" },
  tile: {
    position: "absolute",
    overflow: "hidden",
    boxShadow: `0 20px 40px -20px ${withAlpha(t.colors.scrim, t.dark ? 0.6 : 0.35)}`,
  },
  veil: { position: "absolute", inset: 0, backgroundColor: withAlpha(t.colors.scrim, 0.12) },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 140 },
  badge: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.dark ? t.colors.inverse : t.colors.chrome,
    boxShadow: `0 20px 30px -14px ${withAlpha(t.colors.scrim, t.dark ? 0.8 : 0.5)}`,
  },
  logo: { width: 88, height: 88, borderRadius: 30 },
  /* logo.png é 425×200 */
  logoOnLight: { width: 64, height: 30 },
}));
