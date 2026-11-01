import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { type Palette, useColors } from "@/design";

/** Amarelo e areia só do confete (sem token: não aparecem em mais nada do app). Ficam iguais
    nos dois temas, porque o fundo da celebração é `chrome` nos dois. */
const CONFETTI_YELLOW = "#ffd27a";
const CONFETTI_SAND = "#eee9e5";
const confettiColors = (c: Palette) =>
  [c.brand, c.onMedia, CONFETTI_SAND, c.danger, c.brand300, CONFETTI_YELLOW] as const;
const PALETTE_SIZE = 6;
const COUNT = 48;

/** `color` = índice na paleta do confete (resolvida no tema ao desenhar). */
type Piece = { x: number; delay: number; duration: number; color: number; rotate: number };

// mesma distribuição do protótipo (sem aleatório: render puro)
const PIECES: readonly Piece[] = Array.from({ length: COUNT }, (_, i) => ({
  x: ((i * 37) % 100) / 100,
  delay: (i % 7) * 180,
  duration: 2400 + (i % 5) * 450,
  color: i % PALETTE_SIZE,
  rotate: (i * 47) % 360,
}));

/** Confete caindo uma vez (.confetti): uma animação por partícula, na UI thread. */
export function Confetti() {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  if (reduceMotion) return null;
  const palette = confettiColors(colors);
  return (
    <View
      style={styles.layer}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PIECES.map((p) => (
        <ConfettiPiece
          key={`${p.x}-${p.delay}`}
          piece={p}
          color={palette[p.color] ?? colors.onMedia}
          width={width}
          fall={height + 40}
        />
      ))}
    </View>
  );
}

type PieceProps = { piece: Piece; color: string; width: number; fall: number };

function ConfettiPiece({ piece, color, width, fall }: PieceProps) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.linear })),
    );
  }, [piece, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: t.get() * fall }, { rotate: `${piece.rotate + t.get() * 720}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.piece, { left: piece.x * width, backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, overflow: "hidden", zIndex: 1 },
  piece: { position: "absolute", top: -20, width: 9, height: 14, borderRadius: 2 },
});
