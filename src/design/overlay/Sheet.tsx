import { useEffect } from "react";
import {
  BackHandler,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useStore } from "zustand";
import { easings } from "../easings";
import { createStyles } from "../theme/createStyles";
import { motion, radii } from "../tokens";
import { overlayStore, type SheetEntry, sheet, sheetApi } from "./store";

const OPEN_SPRING = { duration: motion.slow, dampingRatio: 0.9 };
const BACK_SPRING = { duration: 350, dampingRatio: 0.85 };
const CLOSE = { duration: 280, easing: easings.ease };
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
// referências soltas: os worklets capturam só a função, não o objeto `sheet` inteiro
const finishSheet = sheet._finish;
const closeSheet = sheet.close;

/** Painel inferior atual (.sheet / .sheet-bg). Montado uma vez pelo OverlayHost. */
export function Sheet() {
  const entry = useStore(overlayStore, (s) => s.sheet);
  if (!entry) return null;
  return <SheetView key={entry.id} entry={entry} />;
}

function SheetView({ entry }: { entry: SheetEntry }) {
  const styles = useStyles();
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dismissible = entry.options.dismissible ?? true;
  const scrollable = entry.options.scrollable ?? false;

  const y = useSharedValue(screenH);
  const h = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.set(withTiming(1, { duration: motion.base }));
  }, [fade]);

  // saída: desce até a própria altura, apaga o fundo e libera o store
  useEffect(() => {
    if (!entry.closing) return;
    const id = entry.id;
    fade.set(withTiming(0, { duration: motion.fast }));
    y.set(
      withTiming(h.get() || screenH, CLOSE, (finished) => {
        if (finished) scheduleOnRN(finishSheet, id);
      }),
    );
  }, [entry.closing, entry.id, fade, h, y, screenH]);

  useEffect(() => {
    if (entry.closing) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dismissible) sheet.close();
      return true;
    });
    return () => sub.remove();
  }, [entry.closing, dismissible]);

  const onLayout = (e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    const first = h.get() === 0;
    h.set(height);
    // entra de translateY(100%) da própria altura, como o @keyframes up
    if (first && !entry.closing) {
      y.set(withSequence(withTiming(height, { duration: 0 }), withSpring(0, OPEN_SPRING)));
    }
  };

  const pan = usePanGesture({
    enabled: dismissible,
    activeOffsetY: 8,
    failOffsetX: [-24, 24],
    onUpdate: (e) => {
      "worklet";
      const t = e.translationY;
      y.set(t < 0 ? t / 5 : t);
      if (h.get() > 0) fade.set(1 - Math.min(1, Math.max(0, t) / h.get()));
    },
    onDeactivate: (e) => {
      "worklet";
      const far = e.translationY > Math.min(DISMISS_DISTANCE, h.get() * 0.35);
      if (far || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(closeSheet);
      } else {
        y.set(withSpring(0, BACK_SPRING));
        fade.set(withTiming(1, { duration: motion.fast }));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  const content = typeof entry.content === "function" ? entry.content(sheetApi) : entry.content;
  const grab = (
    <View style={styles.grabArea}>
      <View style={styles.grab} />
    </View>
  );

  const body = (
    <Animated.View
      onLayout={onLayout}
      accessibilityViewIsModal
      style={[
        styles.sheet,
        { maxHeight: screenH * 0.86, paddingBottom: Math.max(insets.bottom + 8, 38) },
        sheetStyle,
      ]}
    >
      {scrollable ? (
        <>
          <GestureDetector gesture={pan}>{grab}</GestureDetector>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {content}
          </ScrollView>
        </>
      ) : (
        <>
          {grab}
          {content}
        </>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.layer}>
      <Animated.View style={[styles.backdrop, bgStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissible ? sheet.close : undefined}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
      </Animated.View>
      {scrollable ? body : <GestureDetector gesture={pan}>{body}</GestureDetector>}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  layer: { ...StyleSheet.absoluteFill, zIndex: 85 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: t.colors.overlay },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // no escuro o painel é a superfície elevada (mais clara que o fundo), com fio no topo
    backgroundColor: t.colors.surfaceRaised,
    ...(t.dark ? t.shadows.hairline : null),
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: 12,
    paddingHorizontal: 22,
  },
  // alça .grab (40×5) com área de toque maior para arrastar
  grabArea: { alignItems: "center", paddingBottom: 18, marginTop: -12, paddingTop: 12 },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.dark ? t.colors.borderStrong : t.colors.border,
  },
}));
