import { useRouter } from "expo-router";
import { View } from "react-native";
import type { EventCard } from "@/contracts/app/agenda";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  DashedDivider,
  fontFamily,
  Icon,
  motion,
  Photo,
  Pill,
  PressableScale,
  radii,
  Text,
  ToneSurface,
  useColors,
} from "@/design";
import { eventDayLabel, eventIcon, longEventLabel } from "@/features/agenda";
import { timeRange } from "@/shared/lib/format";
import { eventSubtitle } from "../lib/home";

type Props = { event: EventCard; today: string; dark?: boolean };

/** Foto redonda do card (pt). */
const PHOTO = 50;

/** Card de evento da grade "Hoje na ARP" (.dcard + EvCard do protótipo). `dark` = `chrome`. */
export function EventDCard({ event, today, dark = false }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const image = mediaUrl(event.imageUrl);
  const day = event.nextDate ? eventDayLabel(event.nextDate, today, "short") || null : null;
  const when = event.isLongRunning
    ? longEventLabel(event)
    : event.startTime
      ? timeRange(event.startTime, event.endTime)
      : null;
  const subtitle = eventSubtitle(when, event.place);

  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => router.push({ pathname: "/evento/[id]", params: { id: event.id } })}
      accessibilityLabel={[event.title, day, subtitle, event.awardsSeal ? "Vale selo" : null]
        .filter(Boolean)
        .join(". ")}
      style={[styles.card, dark && styles.dark]}
    >
      <View style={styles.top}>
        {image ? (
          <Photo
            source={image}
            displayWidth={PHOTO}
            recyclingKey={`ev-${event.id}`}
            style={[styles.photo, dark ? styles.ringDark : styles.ring]}
          />
        ) : (
          <ToneSurface
            tone={event.tone}
            style={[styles.photo, dark ? styles.ringDark : styles.ring]}
          >
            <View style={styles.center}>
              <Icon name={eventIcon(event)} size={21} color={colors.onMedia} />
            </View>
          </ToneSurface>
        )}
        {day ? <Pill label={day} variant={dark ? "brand" : "white"} /> : null}
      </View>
      <Text variant="h4" tone={dark ? "onChrome" : "text"} style={styles.title} numberOfLines={3}>
        {event.title}
      </Text>
      <Text style={styles.sub} tone={dark ? "onChromeMuted" : "textMuted"} numberOfLines={2}>
        {subtitle}
      </Text>
      <DashedDivider light={dark} spacing={0} style={styles.dashed} />
      <View style={styles.foot}>
        {event.awardsSeal ? (
          <Pill label="Vale selo" icon="award" variant="brand" />
        ) : (
          <>
            <Text style={styles.footText} tone={dark ? "onChrome" : "text"}>
              Ver detalhes
            </Text>
            <Icon
              name="arrow-right"
              size={17}
              color={dark ? colors.onChromeMuted : colors.textMuted}
            />
          </>
        )}
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  card: {
    flex: 1,
    minHeight: 196,
    padding: 16,
    borderRadius: radii.card,
    backgroundColor: t.colors.surface,
  },
  dark: { backgroundColor: t.colors.chrome, ...t.shadows.cardDark },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2 },
  ring: t.shadows.photoRing,
  ringDark: t.shadows.photoRingDark,
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 18, marginBottom: 2 },
  sub: { fontSize: 13, lineHeight: 18 },
  dashed: { marginTop: 14, marginBottom: 12 },
  foot: {
    marginTop: "auto",
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footText: { fontFamily: fontFamily(650), fontSize: 13, lineHeight: 18 },
}));
