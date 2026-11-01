import { useEffect } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { MerchantCouponStats } from "@/contracts/app/merchant";
import {
  createStyles,
  DashedDivider,
  fontFamily,
  Icon,
  layout,
  Text,
  tracking,
  useColors,
  useScreenFocused,
  withAlpha,
} from "@/design";
import { useNow } from "@/shared/hooks/useNow";
import { plural } from "@/shared/lib/format";
import { MINUTE_MS } from "@/shared/lib/time";
import { couponWindowLabel } from "../lib/overview";

const GAP = 10;

export type CouponCarouselProps = {
  coupons: readonly MerchantCouponStats[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Cupons no ar (.kpi-hero). Um só: o cartão. Vários: carrossel horizontal com pontos; o cupom
 * à vista é o selecionado (a grade de estoque abaixo segue ele).
 */
export function CouponCarousel({ coupons, selectedId, onSelect }: CouponCarouselProps) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const cardW = width - layout.gutter * 2;
  const interval = cardW + GAP;
  const index = Math.max(
    0,
    coupons.findIndex((c) => c.id === selectedId),
  );

  if (coupons.length === 1 && coupons[0]) {
    return (
      <View style={styles.single}>
        <LiveHero coupon={coupons[0]} />
      </View>
    );
  }

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / interval);
    const next = coupons[Math.min(coupons.length - 1, Math.max(0, i))];
    if (next && next.id !== selectedId) onSelect(next.id);
  };

  return (
    <View style={styles.carousel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.track}
        onMomentumScrollEnd={onEnd}
        accessibilityLabel={`${plural(coupons.length, "cupom no ar", "cupons no ar")}. Deslize para ver os outros.`}
      >
        {coupons.map((c) => (
          <View key={c.id} style={{ width: cardW }}>
            <LiveHero coupon={c} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots} importantForAccessibility="no-hide-descendants">
        {coupons.map((c, i) => (
          <View key={c.id} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

/** Um cupom no ar: usados de liberados (grande) e pegos / aguardando / voltaram. */
export function LiveHero({ coupon }: { coupon: MerchantCouponStats }) {
  const colors = useColors();
  const styles = useStyles();
  const now = useNow(MINUTE_MS);
  const soft = withAlpha(colors.onBrand, 0.72);
  return (
    <View
      style={styles.hero}
      accessible
      accessibilityLabel={`Cupom ativo: ${coupon.title}. ${coupon.redeemed} usados de ${coupon.total} liberados. ${coupon.claimed} pegos, ${coupon.waiting} aguardando uso, ${coupon.returned} voltaram.`}
    >
      <LivePill />
      <View style={styles.kicker}>
        <Icon name="ticket-percent" size={16} color={soft} />
        <Text style={styles.kickerText} color={soft} numberOfLines={1}>
          Cupom ativo · {couponWindowLabel(coupon, now)}
        </Text>
      </View>
      <Text style={styles.title} tone="onBrand" numberOfLines={2}>
        {coupon.title}
      </Text>
      <View style={styles.big}>
        <Text style={styles.bigNumber} tone="onBrand" tabular>
          {coupon.redeemed}
        </Text>
        <Text style={styles.bigLabel} color={soft}>
          usados de {coupon.total} liberados
        </Text>
      </View>
      <DashedDivider color={withAlpha(colors.onBrand, 0.2)} />
      <View style={styles.stats}>
        <Stat value={coupon.claimed} label="pegos" />
        <Stat value={coupon.waiting} label="aguardando uso" />
        <Stat value={coupon.returned} label="voltaram" />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} tone="onBrand" tabular>
        {value}
      </Text>
      <Text variant="caption" weight={400} color={withAlpha(colors.onBrand, 0.72)}>
        {label}
      </Text>
    </View>
  );
}

/** Pílula "Ao vivo" (.pill.dark.live) com o ponto que pisca (para fora de foco). */
function LivePill() {
  const styles = useStyles();
  const focused = useScreenFocused();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!focused || reduceMotion) {
      cancelAnimation(opacity);
      opacity.set(1);
      return;
    }
    // @keyframes blink { 50% { opacity: .2 } } em 1,4 s
    opacity.set(
      withRepeat(withTiming(0.2, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    return () => cancelAnimation(opacity);
  }, [focused, reduceMotion, opacity]);

  const dot = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <View style={styles.live}>
      <Animated.View style={[styles.liveDot, dot]} />
      <Text style={styles.liveText} tone="onInverse">
        Ao vivo
      </Text>
    </View>
  );
}

/** Nenhum cupom ativo agora: o lugar do hero fica com o aviso. */
export function NoCouponHero() {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.single, styles.empty]}>
      <View style={styles.emptyIcon}>
        <Icon name="ticket-percent" size={24} color={colors.textMuted} />
      </View>
      <Text variant="h4" accessibilityRole="header">
        Nenhum cupom no ar
      </Text>
      <Text variant="small" tone="textMuted" style={styles.emptyText}>
        Quando uma promoção da loja estiver ativa, os números dela aparecem aqui ao vivo. Os usos do
        período continuam abaixo.
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  single: { marginTop: 18, marginHorizontal: layout.gutter },
  carousel: { marginTop: 18 },
  track: { paddingHorizontal: layout.gutter, gap: GAP },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.borderStrong },
  dotOn: { width: 18, backgroundColor: t.colors.text },
  hero: {
    flex: 1,
    padding: 20,
    borderRadius: 32,
    backgroundColor: t.colors.brand,
    overflow: "hidden",
  },
  live: {
    position: "absolute",
    top: 20,
    right: 20,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: t.colors.inverse,
    zIndex: 1,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: t.colors.danger },
  liveText: { fontFamily: fontFamily(650), fontSize: 12, lineHeight: 16 },
  kicker: { flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 96 },
  kickerText: { fontFamily: fontFamily(650), fontSize: 13, lineHeight: 18, flexShrink: 1 },
  title: {
    marginTop: 4,
    paddingRight: 8,
    fontFamily: fontFamily(700),
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: tracking(18, -0.02),
  },
  big: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 10 },
  bigNumber: {
    fontFamily: fontFamily(850),
    fontSize: 64,
    lineHeight: 62,
    letterSpacing: tracking(64, -0.06),
    includeFontPadding: false,
  },
  bigLabel: {
    flexShrink: 1,
    fontFamily: fontFamily(650),
    fontSize: 15,
    lineHeight: 19,
    paddingBottom: 6,
  },
  stats: { flexDirection: "row" },
  stat: { flex: 1 },
  statValue: {
    fontFamily: fontFamily(700),
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: tracking(22, -0.04),
  },
  empty: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: t.colors.surface,
    gap: 6,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyText: { lineHeight: 19 },
}));
