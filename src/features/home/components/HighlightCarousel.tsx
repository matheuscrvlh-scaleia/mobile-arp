import { useIsFocused } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { Highlight } from "@/contracts/app/home";
import { createStyles, easings, layout, toast } from "@/design";
import { openPath } from "@/navigation/navigate";
import { trackHighlightClick, trackHighlightImpression } from "../api/highlight-metrics";
import { highlightTarget } from "../lib/home";
import { HighlightSlide } from "./HighlightSlide";

const GAP = 12;
const AUTOPLAY_MS = 4800;

/**
 * Carrossel de destaques (.hero): paginado com snap, passa sozinho a cada 4,8 s.
 * Pausa enquanto o visitante arrasta, quando a tela perde o foco e com o app em segundo
 * plano. Isolado aqui para
 * o timer não re-renderizar o resto da Início.
 */
export function HighlightCarousel({ items }: { items: readonly Highlight[] }) {
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const { width: screenWidth } = useWindowDimensions();
  const styles = useStyles();
  const ref = useRef<ScrollViewInstance>(null);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);

  const slideWidth = screenWidth - layout.gutter * 2;
  const interval = slideWidth + GAP;
  const count = items.length;
  const active = Math.min(current, Math.max(count - 1, 0));
  const activeId = items[active]?.id;

  // Conta a exibição do destaque visível (uma vez por sessão, ver highlight-metrics).
  useEffect(() => {
    if (focused && activeId) trackHighlightImpression(activeId);
  }, [focused, activeId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => setAppActive(state === "active"));
    return () => sub.remove();
  }, []);

  // Autoplay: cada slide fica 4,8 s; arrastar, sair da tela ou do app reinicia/pausa.
  useEffect(() => {
    if (!focused || !appActive || dragging || count < 2) return;
    const timer = setTimeout(() => {
      const next = active + 1 >= count ? 0 : active + 1;
      ref.current?.scrollTo({ x: next * interval, animated: true });
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [focused, appActive, dragging, count, active, interval]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / interval);
    setCurrent(Math.max(0, Math.min(i, count - 1)));
  };

  const open = (h: Highlight) => {
    const target = highlightTarget(h);
    if (target.kind === "none") return;
    trackHighlightClick(h.id);
    switch (target.kind) {
      case "path":
        openPath(target.href);
        break;
      case "url":
        Linking.openURL(target.url).catch(() =>
          toast.show("Não foi possível abrir o link", "circle-alert"),
        );
        break;
    }
  };

  if (count === 0) return null;

  return (
    <View style={styles.hero}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.track}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onScrollBeginDrag={() => setDragging(true)}
        onScrollEndDrag={() => setDragging(false)}
        accessibilityLabel="Destaques"
      >
        {items.map((h) => (
          <HighlightSlide key={h.id} highlight={h} width={slideWidth} onPress={open} />
        ))}
      </ScrollView>
      {count > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
          {items.map((h, i) => (
            <Dot key={h.id} on={i === active} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** .dots i: 6×6, o ativo estica para 22 e fica na cor do texto. */
function Dot({ on }: { on: boolean }) {
  const styles = useStyles();
  const width = useSharedValue(on ? 22 : 6);

  useEffect(() => {
    width.set(withTiming(on ? 22 : 6, { duration: 350, easing: easings.spring }));
  }, [on, width]);

  const animated = useAnimatedStyle(() => ({ width: width.get() }));
  return <Animated.View style={[styles.dot, on && styles.dotOn, animated]} />;
}

const useStyles = createStyles((t) => ({
  hero: { marginTop: 18 },
  track: { gap: GAP, paddingHorizontal: layout.gutter },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 12 },
  dot: { height: 6, borderRadius: 3, backgroundColor: t.colors.borderStrong },
  dotOn: { backgroundColor: t.colors.text },
}));
