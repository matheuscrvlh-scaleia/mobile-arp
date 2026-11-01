import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { easings } from "@/design";
import {
  type CanvasSize,
  clamp,
  clampTranslate,
  FOCUS_SCALE,
  fitCanvas,
  focusTranslate,
  MAX_SCALE,
  MIN_SCALE,
  toCanvas,
} from "../lib/map-geometry";
import { MapGrid } from "./FloorLayer";

const SETTLE = { duration: 260, easing: easings.ease };
const FOCUS = { duration: 450, easing: easings.ease };

export type MapFocus = { x: number; y: number; key: number };

type Props = {
  /** Distância do topo da área até o desenho (sobra para busca e nome do andar). */
  insetTop: number;
  insetBottom?: number;
  /** Mudou → volta para o zoom inicial (troca de andar, "centralizar"). */
  resetKey: string | number;
  /** Ponto do desenho (viewBox) para ampliar e centralizar. */
  focus: MapFocus | null;
  style?: StyleProp<ViewStyle>;
  children: (canvas: CanvasSize) => ReactNode;
};

/** Área do mapa com pinça para ampliar, arrasto (limitado à borda) e duplo toque para voltar. */
export function MapViewport({
  insetTop,
  insetBottom = 10,
  resetKey,
  focus,
  style,
  children,
}: Props) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  // estável entre renders: o FloorLayer (memo) só redesenha quando a área muda
  const canvas = useMemo(
    () => fitCanvas(area.width, Math.max(0, area.height - insetTop - insetBottom)),
    [area.width, area.height, insetTop, insetBottom],
  );
  const left = (area.width - canvas.width) / 2;

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // centro do desenho dentro da área + tamanho, para as contas na UI thread
  const box = useSharedValue({ cx: 0, cy: 0, w: 0, h: 0 });

  useEffect(() => {
    box.set({
      cx: left + canvas.width / 2,
      cy: insetTop + canvas.height / 2,
      w: canvas.width,
      h: canvas.height,
    });
  }, [box, left, insetTop, canvas.width, canvas.height]);

  const settle = () => {
    "worklet";
    const { w, h } = box.get();
    tx.set(withTiming(clampTranslate(tx.get(), scale.get(), w), SETTLE));
    ty.set(withTiming(clampTranslate(ty.get(), scale.get(), h), SETTLE));
  };

  const pinch = usePinchGesture({
    onUpdate: (e) => {
      const { cx, cy } = box.get();
      const next = clamp(scale.get() * e.scaleChange, MIN_SCALE, MAX_SCALE);
      const ratio = next / scale.get();
      const fx = e.focalX - cx;
      const fy = e.focalY - cy;
      tx.set(fx - (fx - tx.get()) * ratio);
      ty.set(fy - (fy - ty.get()) * ratio);
      scale.set(next);
    },
    onDeactivate: () => settle(),
  });

  const pan = usePanGesture({
    minDistance: 4,
    averageTouches: true,
    onUpdate: (e) => {
      // sem zoom o desenho só "estica" um pouco e volta
      const f = scale.get() > 1.01 ? 1 : 0.25;
      tx.set(tx.get() + e.changeX * f);
      ty.set(ty.get() + e.changeY * f);
    },
    onDeactivate: () => settle(),
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      scale.set(withTiming(1, FOCUS));
      tx.set(withTiming(0, FOCUS));
      ty.set(withTiming(0, FOCUS));
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);

  useEffect(() => {
    void resetKey;
    scale.set(withTiming(1, FOCUS));
    tx.set(withTiming(0, FOCUS));
    ty.set(withTiming(0, FOCUS));
  }, [resetKey, scale, tx, ty]);

  const { k, width: cw, height: ch } = canvas;
  useEffect(() => {
    if (!focus || k <= 0) return;
    const s = Math.max(scale.get(), FOCUS_SCALE);
    const p = toCanvas(focus.x, focus.y, k);
    const t = focusTranslate(p.left, p.top, { width: cw, height: ch }, s);
    scale.set(withTiming(s, FOCUS));
    tx.set(withTiming(t.x, FOCUS));
    ty.set(withTiming(t.y, FOCUS));
  }, [focus, k, cw, ch, scale, tx, ty]);

  const transform = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: scale.get() }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== area.width || height !== area.height) setArea({ width, height });
  };

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.area, style]} onLayout={onLayout}>
        {canvas.k > 0 ? <MapGrid width={area.width} height={area.height} k={canvas.k} /> : null}
        {canvas.k > 0 ? (
          <Animated.View
            style={[
              styles.canvas,
              { left, top: insetTop, width: canvas.width, height: canvas.height },
              transform,
            ]}
          >
            {children(canvas)}
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  area: { overflow: "hidden" },
  canvas: { position: "absolute" },
});
