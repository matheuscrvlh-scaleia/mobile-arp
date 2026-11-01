import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  createStyles,
  fontFamily,
  Icon,
  layout,
  motion,
  Pill,
  PressableScale,
  Text,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { timeRange } from "@/shared/lib/format";
import { type AgendaEvent, longEventLabel, periodProgress } from "../lib/occurrence";
import { EventArt } from "./EventArt";

export type LongEventCardProps = {
  event: AgendaEvent;
  /** Dia selecionado na agenda ("YYYY-MM-DD"). */
  date: string;
};

/**
 * Evento longo (.ev-long). O período (`startsOn`/`endsOn`) vem no próprio item da
 * agenda: a barra tem um traço por dia (sem fim ou acima de 62 dias, o mês do dia).
 */
export function LongEventCard({ event, date }: LongEventCardProps) {
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const progress = periodProgress(event, date);
  const place = event.place.split(" · ")[0] ?? event.place;

  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => router.push({ pathname: "/evento/[id]", params: { id: event.id } })}
      accessibilityLabel={`${event.title}, evento de longa duração. ${place}`}
      style={styles.card}
    >
      <EventArt
        event={event}
        displayWidth={width - layout.gutter * 2}
        iconSize={140}
        iconOpacity={0.3}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          withAlpha(colors.scrim, 0.05),
          withAlpha(colors.scrim, 0.05),
          withAlpha(colors.scrim, 0.85),
        ]}
        locations={[0, 0.2, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        <View style={styles.top}>
          <Pill label={longEventLabel(event)} icon="repeat" variant="glass" />
          {event.awardsSeal ? <Pill label="Vale selo" icon="award" variant="brand" /> : null}
        </View>
        <Text style={styles.title} tone="onMedia" numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.meta}>
          {event.startTime ? (
            <View style={styles.metaItem}>
              <Icon name="clock" size={14} color={colors.onMedia} />
              <Text variant="small" tone="onMedia">
                {timeRange(event.startTime, event.endTime)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.metaItem, styles.shrink]}>
            <Icon name="map-pin" size={14} color={colors.onMedia} />
            <Text variant="small" tone="onMedia" numberOfLines={1} style={styles.shrink}>
              {place}
            </Text>
          </View>
        </View>
        <View style={styles.bar}>
          {Array.from({ length: progress.total }, (_, i) => (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: um traço fixo por dia do período
              key={i}
              style={[
                styles.tick,
                i < progress.index && styles.tickPast,
                i === progress.index && styles.tickNow,
              ]}
            />
          ))}
        </View>
        <Text variant="caption" weight={400} tone="onMedia" style={styles.caption}>
          Dia {progress.index + 1} de {progress.total} · aparece em todos os dias da agenda
        </Text>
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  card: {
    marginHorizontal: layout.gutter,
    height: 230,
    borderRadius: 30,
    overflow: "hidden",
    // fundo enquanto a arte carrega (escuro nos dois temas)
    backgroundColor: t.colors.chrome,
  },
  inner: { ...StyleSheet.absoluteFill, padding: 18 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: {
    marginTop: "auto",
    marginBottom: 4,
    fontFamily: fontFamily(800),
    fontSize: 26,
    lineHeight: 29,
    letterSpacing: tracking(26, -0.035),
  },
  meta: { flexDirection: "row", gap: 12, opacity: 0.85 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  shrink: { flexShrink: 1 },
  bar: { marginTop: 12, flexDirection: "row", gap: 2 },
  tick: { flex: 1, height: 5, borderRadius: 2, backgroundColor: t.colors.onMediaLine },
  tickPast: { backgroundColor: withAlpha(t.colors.onMedia, 0.6) },
  tickNow: { backgroundColor: t.colors.brand, transform: [{ scaleY: 1.8 }] },
  caption: { marginTop: 6, opacity: 0.75 },
}));
