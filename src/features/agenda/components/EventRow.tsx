import { useRouter } from "expo-router";
import { View } from "react-native";
import type { EventCard } from "@/contracts/app/agenda";
import { createStyles, Icon, motion, Pill, PressableScale, Text, useColors } from "@/design";
import { useNow } from "@/shared/hooks/useNow";
import { toISODate } from "@/shared/lib/format";
import { type AgendaEvent, type EventRowData, rowWhen } from "../lib/occurrence";
import { EventArt } from "./EventArt";

export type { AgendaEvent } from "../lib/occurrence";

export type EventRowProps = {
  /** `EventCard` (busca, home) ou item de `Agenda.days[].events`. */
  event: EventCard | AgendaEvent;
  /** Dia da ocorrência ("YYYY-MM-DD"); itens da agenda precisam dele para o rótulo. */
  date?: string;
};

/** Foto/arte da linha (pt). */
const IMG = 92;

/** Linha de evento (.ev-row): foto/tom, título, quando, onde e pills. Toque → /evento/{id}. */
export function EventRow({ event, date }: EventRowProps) {
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const today = toISODate(useNow(60_000));
  const data: EventRowData = event;
  const when = rowWhen(data, today, date);

  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => router.push({ pathname: "/evento/[id]", params: { id: event.id } })}
      accessibilityLabel={`${event.title}. ${when}. ${event.place}`}
      style={styles.row}
    >
      <EventArt event={event} displayWidth={IMG} style={styles.img} />
      <View style={styles.body}>
        <Text variant="h4" numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.meta}>
          {when ? (
            <View style={styles.metaLine}>
              <Icon name="calendar-days" size={14} color={colors.textMuted} />
              <Text variant="small" tone="textMuted" numberOfLines={1} style={styles.metaText}>
                {when}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaLine}>
            <Icon name="map-pin" size={14} color={colors.textMuted} />
            <Text variant="small" tone="textMuted" numberOfLines={1} style={styles.metaText}>
              {event.place}
            </Text>
          </View>
        </View>
        <View style={styles.tags}>
          <Pill label={event.category.name} variant="white" />
          {event.awardsSeal ? <Pill label="Vale selo" icon="award" variant="brand" /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 10,
    borderRadius: 26,
    backgroundColor: t.colors.surface,
  },
  img: { width: IMG, height: IMG, borderRadius: 20 },
  body: { flex: 1, minWidth: 0 },
  meta: { marginTop: 4, gap: 3 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { flexShrink: 1 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
}));
