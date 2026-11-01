import { useRef } from "react";
import { ScrollView, type ScrollViewInstance, View } from "react-native";
import {
  createStyles,
  fontFamily,
  layout,
  PressableScale,
  Text,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { capitalize, formatLongDate, parseISODate, weekdayName } from "@/shared/lib/format";

const DAY_W = 58;
const GAP = 8;

export type DayStripProps = {
  /** Datas "YYYY-MM-DD"; a primeira é hoje. */
  days: readonly string[];
  selected: string;
  onSelect: (iso: string) => void;
  /** Dias com ponto (evento que não é longo). */
  marked: ReadonlySet<string>;
};

/** Faixa de dias (.days / .day): "hoje" + dia da semana curto, ponto quando há evento.
    O dia escolhido é um chip ligado: `inverse` (escuro no claro, claro no escuro). */
export function DayStrip({ days, selected, onSelect, marked }: DayStripProps) {
  const colors = useColors();
  const styles = useStyles();
  const onMuted = withAlpha(colors.onInverse, 0.6);
  const scroll = useRef<ScrollViewInstance>(null);

  const select = (iso: string, i: number) => {
    onSelect(iso);
    // deixa o dia anterior à vista, para indicar que dá para voltar
    scroll.current?.scrollTo({ x: Math.max(0, (i - 1) * (DAY_W + GAP)), animated: true });
  };

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {days.map((iso, i) => {
        const on = iso === selected;
        const d = parseISODate(iso);
        const has = marked.has(iso);
        return (
          <PressableScale
            key={iso}
            onPress={() => select(iso, i)}
            accessibilityLabel={`${i === 0 ? "Hoje, " : ""}${formatLongDate(d)}${has ? ", com eventos" : ""}`}
            accessibilityState={{ selected: on }}
            style={[styles.day, on && styles.dayOn]}
          >
            <Text style={styles.small} color={on ? onMuted : colors.textMuted}>
              {capitalize(i === 0 ? "hoje" : weekdayName(d, true))}
            </Text>
            <Text style={styles.num} tone={on ? "onInverse" : "text"} tabular>
              {d.getDate()}
            </Text>
            {has ? <View style={styles.dot} /> : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const useStyles = createStyles((t) => ({
  row: { gap: GAP, paddingHorizontal: layout.gutter, paddingTop: 4, paddingBottom: 14 },
  day: {
    width: DAY_W,
    height: 82,
    borderRadius: 22,
    backgroundColor: t.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayOn: {
    backgroundColor: t.colors.inverse,
    // translateY(-2px) do CSS; `top` porque o transform é do PressableScale
    top: -2,
    ...t.shadows.dayOn,
  },
  small: { fontFamily: fontFamily(600), fontSize: 12, lineHeight: 16 },
  num: {
    fontFamily: fontFamily(800),
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: tracking(22, -0.03),
  },
  dot: {
    position: "absolute",
    bottom: 10,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: t.colors.brand,
  },
}));
