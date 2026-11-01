import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  createStyles,
  easings,
  hitSlop,
  Icon,
  Text,
  useColors,
  useScreenFocused,
  useTheme,
} from "@/design";
import { mapColors } from "../lib/map-colors";
import {
  type CanvasSize,
  type MapCategory,
  type MapFloor,
  type MapPin,
  matchesPin,
  toCanvas,
} from "../lib/map-geometry";

/* Pinos, pontos de referência e pulsações por cima do desenho do andar.
   Views (não SVG): toque, ícones lucide e animações do Reanimated funcionam direto. */

const PIN_R = 15;
const PIN_R_SEL = 19;

/**
 * Onda que cresce e some (@keyframes pulse: scale .6 → 2.2, opacidade .8 → 0).
 * Para quando a aba Mapa perde o foco (a aba fica montada) e com "reduzir movimento".
 */
function Pulse({
  left,
  top,
  radius,
  color,
  opacity,
  duration,
}: {
  left: number;
  top: number;
  radius: number;
  color: string;
  opacity: number;
  duration: number;
}) {
  const styles = useStyles();
  const focused = useScreenFocused();
  const reduceMotion = useReducedMotion();
  const run = focused && !reduceMotion;
  const p = useSharedValue(0);
  useEffect(() => {
    if (!run) {
      cancelAnimation(p);
      p.set(0);
      return;
    }
    p.set(withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(p);
  }, [p, duration, run]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity * 0.8 * (1 - p.get()),
    transform: [{ scale: 0.6 + 1.6 * p.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.round,
        {
          left: left - radius,
          top: top - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function Pin({
  pin,
  k,
  selected,
  dim,
  onPress,
}: {
  pin: MapPin;
  k: number;
  selected: boolean;
  dim: boolean;
  onPress: (pin: MapPin) => void;
}) {
  const c = useColors();
  const styles = useStyles();
  const { left, top } = toCanvas(pin.x, pin.y, k);
  const outer = (PIN_R + 2.5) * k;
  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.set(withTiming(selected ? 1 : 0, { duration: 300, easing: easings.spring }));
  }, [selected, sel]);
  const grow = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + sel.get() * ((PIN_R_SEL + 2.5) / (PIN_R + 2.5) - 1) }],
  }));

  return (
    <>
      {selected ? (
        <Pulse
          left={left}
          top={top}
          radius={16 * k}
          color={pin.brandColor}
          opacity={0.45}
          duration={1600}
        />
      ) : null}
      <Animated.View
        style={[
          styles.round,
          {
            left: left - outer,
            top: top - outer,
            width: outer * 2,
            height: outer * 2,
            borderRadius: outer,
            backgroundColor: pin.brandColor,
          },
          styles.edge,
          dim && styles.dim,
          selected && styles.front,
          grow,
        ]}
      >
        <Pressable
          onPress={() => onPress(pin)}
          hitSlop={hitSlop.sm}
          accessibilityRole="button"
          accessibilityLabel={pin.name}
          accessibilityState={{ selected }}
          style={styles.pinHit}
        >
          <View
            style={[
              styles.pinInner,
              {
                width: (PIN_R - 1) * 2 * k,
                height: (PIN_R - 1) * 2 * k,
                borderRadius: (PIN_R - 1) * k,
              },
            ]}
          >
            <Icon name={pin.icon} size={13 * k} color={c.onMedia} strokeWidth={2.2} />
          </View>
        </Pressable>
      </Animated.View>
      {selected ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          pointerEvents="none"
          style={[styles.balloon, { left: left - 110, top: top - 18 * k - 32 }]}
        >
          <View style={styles.balloonPill}>
            <Text variant="caption" weight={700} tone="onInverse" numberOfLines={1}>
              {pin.name}
            </Text>
          </View>
          <View style={styles.balloonArrow} />
        </Animated.View>
      ) : null}
    </>
  );
}

type Props = {
  floor: MapFloor;
  canvas: CanvasSize;
  ground: boolean;
  selectedId: string | null;
  category: MapCategory;
  q: string;
  onPinPress: (pin: MapPin) => void;
};

export function PinsLayer({ floor, canvas, ground, selectedId, category, q, onPinPress }: Props) {
  const c = useColors();
  const m = mapColors[useTheme().scheme];
  const styles = useStyles();
  const { k } = canvas;
  const you = toCanvas(180, 432, k);
  const point = 24 * k;
  // a selecionada por último fica por cima das outras
  const pins = [...floor.pins].sort(
    (a, b) => Number(a.storeId === selectedId) - Number(b.storeId === selectedId),
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {floor.points.map((pt) => {
        const { left, top } = toCanvas(pt.x, pt.y, k);
        return (
          <View
            key={pt.id}
            accessible
            accessibilityLabel={pt.label}
            style={[
              styles.point,
              {
                left: left - point / 2,
                top: top - point / 2,
                width: point,
                height: point,
                borderRadius: 8 * k,
              },
            ]}
          >
            <Icon name={pt.icon} size={13 * k} color={c.onInverse} />
          </View>
        );
      })}
      {ground ? (
        <Pulse
          left={you.left}
          top={you.top}
          radius={10 * k}
          color={m.you}
          opacity={0.35}
          duration={2000}
        />
      ) : null}
      {pins.map((pin) => (
        <Pin
          key={pin.storeId}
          pin={pin}
          k={k}
          selected={pin.storeId === selectedId}
          dim={!matchesPin(pin, category, q)}
          onPress={onPinPress}
        />
      ))}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  round: { position: "absolute", alignItems: "center", justifyContent: "center" },
  pinHit: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  pinInner: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: t.colors.onMedia,
  },
  // separa cores de marca escuras do fundo noturno (só no tema escuro)
  edge: { boxShadow: mapColors[t.scheme].pinEdge },
  dim: { opacity: 0.25 },
  front: { zIndex: 2 },
  point: {
    position: "absolute",
    backgroundColor: t.colors.inverse,
    alignItems: "center",
    justifyContent: "center",
  },
  balloon: { position: "absolute", width: 220, alignItems: "center", zIndex: 3 },
  balloonPill: {
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: t.colors.inverse,
    justifyContent: "center",
    maxWidth: 220,
  },
  balloonArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: t.colors.inverse,
  },
}));
