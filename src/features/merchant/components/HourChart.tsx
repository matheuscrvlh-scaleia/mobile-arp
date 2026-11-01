import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { MerchantOverview, MerchantPeriod } from "@/contracts/app/merchant";
import { createStyles, easings, fontFamily, Pill, Text } from "@/design";
import { plural } from "@/shared/lib/format";
import { type HourBar, hourBars, hourLabel, PERIOD_LABEL, peakHour } from "../lib/overview";
import { Panel } from "./Panel";

const CHART_H = 120;
/** Barra vazia ainda aparece um tiquinho (.chart .col i: min 6%). */
const MIN_PCT = 6;

export type HourChartProps = {
  rows: MerchantOverview["redemptionsByHour"];
  period: MerchantPeriod;
};

/**
 * "Usos por hora" (.chart): só as horas com movimento (±1 h; sem uso, 8h–23h), barra mais alta
 * escura com o balão "N usos" e a pílula "pico às 19h". As barras crescem (scaleY) ao montar.
 */
export function HourChart({ rows, period }: HourChartProps) {
  const styles = useStyles();
  const bars = hourBars(rows);
  const peak = peakHour(rows);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const max = Math.max(0, ...bars.map((b) => b.count));
  const dense = bars.length > 12;
  const peakCount = bars.find((b) => b.peak)?.count ?? 0;

  return (
    <Panel
      title="Usos por hora"
      right={
        peak !== null ? (
          <Pill variant="white" icon="trending-up" label={`pico às ${hourLabel(peak)}`} />
        ) : null
      }
      subtitle={`${PERIOD_LABEL[period]} · ${total ? plural(total, "uso", "usos") : "nenhum uso ainda"}`}
    >
      <View
        style={[styles.chart, dense && styles.chartDense]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          peak !== null
            ? `Usos por hora. Pico às ${hourLabel(peak)}, com ${plural(peakCount, "uso", "usos")}.`
            : "Usos por hora: nenhum uso no período."
        }
      >
        {bars.map((bar, i) => (
          <Column key={bar.hour} bar={bar} max={max} index={i} dense={dense} />
        ))}
      </View>
    </Panel>
  );
}

function Column({
  bar,
  max,
  index,
  dense,
}: {
  bar: HourBar;
  max: number;
  index: number;
  dense: boolean;
}) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const grow = useSharedValue(reduceMotion ? 1 : 0);
  const pct = max > 0 ? Math.max(MIN_PCT, (bar.count / max) * 100) : MIN_PCT;

  useEffect(() => {
    if (reduceMotion) return;
    // @keyframes grow { from { scaleY(0) } } .8s spring, 0,05 s por coluna
    grow.set(withDelay(index * 50, withTiming(1, { duration: 800, easing: easings.spring })));
  }, [grow, index, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scaleY: grow.get() }] }));

  return (
    <View style={styles.col}>
      <View style={styles.area}>
        <Animated.View
          style={[
            styles.bar,
            dense && styles.barDense,
            bar.peak && styles.barPeak,
            { height: `${pct}%` },
            animated,
          ]}
        />
        {bar.peak ? (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(index * 50 + 500)}
            style={[styles.tipWrap, { bottom: `${pct}%` }]}
          >
            <View style={styles.tip}>
              <Text style={styles.tipText} tone="onInverse" numberOfLines={1}>
                {plural(bar.count, "uso", "usos")}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
      <Text style={styles.label} tone="textMuted" numberOfLines={1}>
        {bar.showLabel ? hourLabel(bar.hour) : " "}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: CHART_H,
    // espaço do balão do pico (top: -26 no CSS)
    marginTop: 30,
  },
  chartDense: { gap: 3 },
  col: { flex: 1, height: "100%", alignItems: "center", gap: 6 },
  area: { flex: 1, alignSelf: "stretch", justifyContent: "flex-end" },
  bar: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: t.colors.borderStrong,
    transformOrigin: "bottom",
  },
  barDense: { borderRadius: 4 },
  barPeak: { backgroundColor: t.colors.inverse },
  tipWrap: {
    position: "absolute",
    left: -40,
    right: -40,
    marginBottom: 6,
    alignItems: "center",
  },
  tip: {
    backgroundColor: t.colors.inverse,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  tipText: { fontFamily: fontFamily(700), fontSize: 11, lineHeight: 14 },
  label: { fontFamily: fontFamily(400), fontSize: 11, lineHeight: 14 },
}));
