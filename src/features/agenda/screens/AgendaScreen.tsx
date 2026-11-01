import { type ReactNode, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  BottomSpacer,
  Chip,
  EmptyState,
  layout,
  NavHeader,
  Pill,
  ScreenContainer,
  Skeleton,
  SkeletonCard,
  Text,
} from "@/design";
import { useNow } from "@/shared/hooks/useNow";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { plural, toISODate } from "@/shared/lib/format";
import { MINUTE_MS } from "@/shared/lib/time";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useAgenda } from "../api/agenda";
import { DayStrip } from "../components/DayStrip";
import { EventRow } from "../components/EventRow";
import { LongEventCard } from "../components/LongEventCard";
import {
  AGENDA_WINDOW_DAYS,
  categoriesOf,
  dateRange,
  filterByCategory,
  hasShortEvent,
  indexDays,
  monthYearLabel,
  sectionDayLabel,
  upcomingAfter,
  upcomingAgendaRange,
} from "../lib/occurrence";

/** Faixa de dias visível (a janela carregada é `upcomingAgendaRange`). */
const STRIP_DAYS = 14;

export default function AgendaScreen() {
  const today = toISODate(useNow(MINUTE_MS));
  const query = useAgenda(upcomingAgendaRange(today));
  // O dia escolhido é guardado como data: na virada da meia-noite a faixa anda,
  // mas a escolha continua no mesmo dia (ou cai em "hoje", se ele já passou).
  const [picked, setPicked] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const refreshControl = useRefreshControl(query.refetch);

  const strip = dateRange(today, STRIP_DAYS);
  const selected = picked && strip.includes(picked) ? picked : today;

  const allDays = query.data?.days ?? [];
  const categories = categoriesOf(allDays);
  // categoria que sumiu da agenda (após atualizar) volta para "Todas"
  const activeCategory = categories.some((c) => c.id === categoryId) ? categoryId : null;
  const days = filterByCategory(allDays, activeCategory);
  const byDate = indexDays(days);

  const marked = new Set(strip.filter((d) => hasShortEvent(byDate.get(d))));
  const dayEvents = byDate.get(selected) ?? [];
  const longs = dayEvents.filter((e) => e.isLongRunning);
  const shorts = dayEvents.filter((e) => !e.isLongRunning);
  const upcoming = upcomingAfter(days, selected, 4, new Set(shorts.map((e) => e.id)));
  const total = dayEvents.length;

  const view = queryView(query);

  let content: ReactNode;
  if (view !== "ready") {
    content = (
      <QueryFallback
        view={view}
        skeleton={<AgendaSkeleton />}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  } else if (allDays.length === 0) {
    content = (
      <EmptyState
        icon="calendar-days"
        title="Agenda vazia por enquanto"
        text={`Ainda não há eventos nos próximos ${AGENDA_WINDOW_DAYS} dias. Volte em breve.`}
      />
    );
  } else {
    content = (
      <>
        {longs.length > 0 ? (
          <View style={styles.longs}>
            {longs.map((e) => (
              <LongEventCard key={e.id} event={e} date={selected} />
            ))}
          </View>
        ) : null}

        <View style={styles.secH}>
          <Text variant="h2" accessibilityRole="header">
            {sectionDayLabel(selected, today)}
          </Text>
          <Text variant="small" tone="textMuted">
            {plural(total, "evento", "eventos")}
          </Text>
        </View>
        {shorts.length > 0 ? (
          <View style={styles.list}>
            {shorts.map((e) => (
              <EventRow key={e.id} event={e} date={selected} />
            ))}
          </View>
        ) : (
          <Text variant="muted" align="center" style={styles.dayEmpty}>
            {longs.length > 0
              ? `Só ${longs.map((e) => e.title).join(" e ")} neste dia.`
              : "Nenhum evento neste dia."}
            {"\n"}Veja o que vem por aí.
          </Text>
        )}

        {upcoming.length > 0 ? (
          <>
            <View style={styles.secH}>
              <Text variant="h2" accessibilityRole="header">
                Próximos dias
              </Text>
            </View>
            <View style={styles.list}>
              {upcoming.map((x) => (
                <EventRow key={x.event.id} event={x.event} date={x.date} />
              ))}
            </View>
          </>
        ) : null}
      </>
    );
  }

  return (
    <ScreenContainer top="none" scroll scrollProps={{ refreshControl }}>
      <NavHeader right={<Pill label={monthYearLabel(selected)} icon="calendar-days" />} />
      <View style={styles.titleWrap}>
        <Text variant="title" accessibilityRole="header">
          Agenda
        </Text>
      </View>

      <View style={styles.strip}>
        <DayStrip days={strip} selected={selected} onSelect={setPicked} marked={marked} />
      </View>

      {categories.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="Todas" on={!activeCategory} onPress={() => setCategoryId(null)} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              on={activeCategory === c.id}
              onPress={() => setCategoryId(activeCategory === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {content}
      <BottomSpacer kind="safe" />
    </ScreenContainer>
  );
}

function AgendaSkeleton() {
  return (
    <View accessibilityLabel="Carregando agenda">
      <View style={styles.secH}>
        <Skeleton width={110} height={22} />
        <Skeleton width={60} height={14} />
      </View>
      <View style={styles.list}>
        <SkeletonCard height={112} radius={26} />
        <SkeletonCard height={112} radius={26} />
        <SkeletonCard height={112} radius={26} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: { paddingHorizontal: layout.gutter, marginTop: 14 },
  strip: { marginTop: 18 },
  chips: { gap: 8, paddingHorizontal: layout.gutter, paddingTop: 4 },
  longs: { marginTop: 18, gap: 12 },
  secH: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: layout.sectionTop,
    marginBottom: layout.sectionBottom,
    marginHorizontal: layout.gutter,
  },
  list: { gap: 12, paddingHorizontal: layout.gutter },
  dayEmpty: { paddingVertical: 20, paddingHorizontal: 30 },
});
