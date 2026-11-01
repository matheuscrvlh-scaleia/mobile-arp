import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { STORE_KIND_LABEL, type StoreKind } from "@/contracts/directory";
import { mediaUrl } from "@/core/api/media";
import { kv } from "@/core/storage/kv";
import {
  BottomSpacer,
  Chip,
  EmptyState,
  IconButton,
  layout,
  Photo,
  ScreenContainer,
  SearchField,
  SectionHeader,
  Skeleton,
  Text,
  useColors,
  useTheme,
} from "@/design";
import { eventIcon, occurrenceLabel, upcomingAgendaRange, useAgenda } from "@/features/agenda";
import { MonoTile, ResultRow, storeLocation, useStoreCategories } from "@/features/stores";
import { goBackOr, openPath } from "@/navigation/navigate";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useNow } from "@/shared/hooks/useNow";
import { toISODate } from "@/shared/lib/format";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { SEARCH_MIN, useCouponSearch, useStoreSearch } from "../api/search";
import { filterEvents } from "../lib/events-search";
import { parseRecent, pushRecent, RECENT_SEARCHES_KEY } from "../lib/recent-searches";

const KINDS: StoreKind[] = ["food", "shop"];
/** Busca da API: acima disso ela recusa (400). */
const QUERY_MAX = 120;
/** Espera o visitante parar de digitar (menos chamadas por busca). */
const DEBOUNCE_MS = 450;
/** Foto das linhas de resultado (pt), do tamanho do `MonoTile`. */
const PHOTO_SIZE = 44;

function readRecent(): string[] {
  try {
    return parseRecent(kv.getSync(RECENT_SEARCHES_KEY));
  } catch {
    return [];
  }
}

/** Busca geral (/busca): lojas, cupons e eventos num campo só. */
export default function SearchScreen() {
  const colors = useColors();
  const { toneOf } = useTheme();
  const [text, setText] = useState("");
  const [recent, setRecent] = useState(readRecent);
  const q = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const searching = q.length >= SEARCH_MIN;
  const today = toISODate(useNow(60_000));

  const categories = useStoreCategories();
  const stores = useStoreSearch(q);
  const coupons = useCouponSearch(q);
  // mesma janela e mesma chave da agenda: o que uma carregou a outra já tem
  const agenda = useAgenda(upcomingAgendaRange(today), { enabled: searching });
  const events = filterEvents(agenda.data, q);

  const views = [queryView(stores), queryView(coupons), queryView(agenda)];
  const storeHits = searching ? (stores.data?.data ?? []) : [];
  const couponHits = searching ? (coupons.data?.data ?? []) : [];
  const loading = searching && views.includes("loading");
  const failedView = searching && views.every((v) => v === "offline" || v === "error");
  const nothing =
    searching && !loading && !storeHits.length && !couponHits.length && !events.length;

  const remember = (term?: string) => {
    const next = pushRecent(recent, term ?? text);
    setRecent(next);
    void kv.set(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => undefined);
  };
  const clearRecent = () => {
    setRecent([]);
    void kv.remove(RECENT_SEARCHES_KEY).catch(() => undefined);
  };
  const go = (href: string) => {
    remember();
    openPath(href);
  };

  const retry = () => {
    void stores.refetch();
    void coupons.refetch();
    void agenda.refetch();
  };

  return (
    <ScreenContainer top="header">
      <View style={styles.top}>
        <IconButton icon="chevron-left" accessibilityLabel="Voltar" onPress={() => goBackOr("/")} />
        <SearchField
          value={text}
          onChangeText={setText}
          placeholder="Lojas, cupons e eventos"
          autoFocus
          autoCapitalize="none"
          maxLength={QUERY_MAX}
          onSubmitEditing={() => remember()}
          style={styles.field}
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {!searching ? (
          <>
            {recent.length ? (
              <>
                <SectionHeader
                  title="Buscas recentes"
                  actionLabel="Limpar"
                  onAction={clearRecent}
                />
                {recent.map((term) => (
                  <ResultRow
                    key={term}
                    leading={
                      <MonoTile icon="clock" color={colors.surface} iconColor={colors.textMuted} />
                    }
                    title={term}
                    trailingIcon="arrow-up-right"
                    onPress={() => setText(term)}
                    accessibilityLabel={`Buscar ${term}`}
                  />
                ))}
              </>
            ) : null}
            {KINDS.map((kind) => {
              const cats = (categories.data ?? []).filter((c) => c.kind === kind);
              if (!cats.length) return null;
              return (
                <View key={kind}>
                  <SectionHeader
                    title={STORE_KIND_LABEL[kind]}
                    actionLabel="Ver todas"
                    onAction={() => openPath(`/lojas?tipo=${kind}`)}
                  />
                  <View style={styles.chips}>
                    {cats.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.name}
                        icon={c.icon}
                        onPress={() => openPath(`/lojas?tipo=${kind}&categoria=${c.id}`)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        ) : loading ? (
          <SearchSkeleton />
        ) : failedView ? (
          <QueryFallback
            view={views.includes("offline") ? "offline" : "error"}
            skeleton={null}
            error={stores.error ?? coupons.error}
            onRetry={retry}
            retrying={stores.isFetching || coupons.isFetching}
          />
        ) : nothing ? (
          <EmptyState
            icon="search-x"
            title="Nada encontrado"
            text="Tente outro nome ou categoria."
          />
        ) : (
          <>
            {storeHits.length ? (
              <>
                <SectionHeader
                  title="Lojas"
                  actionLabel="Ver todas"
                  onAction={() =>
                    go(
                      `/lojas?tipo=${storeHits[0]?.category.kind ?? "food"}&q=${encodeURIComponent(q)}`,
                    )
                  }
                />
                {storeHits.map((s) => (
                  <ResultRow
                    key={s.id}
                    leading={
                      <Photo
                        source={mediaUrl(s.coverImageUrl)}
                        recyclingKey={s.id}
                        displayWidth={PHOTO_SIZE}
                        fallbackIcon={s.icon}
                        style={styles.photo}
                      />
                    }
                    title={s.name}
                    subtitle={`${s.category.name} · ${storeLocation(s, { short: true })}`}
                    onPress={() => go(`/loja/${s.slug}`)}
                  />
                ))}
              </>
            ) : null}
            {couponHits.length ? (
              <>
                <SectionHeader title="Cupons" />
                {couponHits.map((c) => (
                  <ResultRow
                    key={c.id}
                    leading={<MonoTile icon={c.icon} color={toneOf(c.tone).gradient[1]} />}
                    title={`${c.headline}${c.headlineSub ? ` ${c.headlineSub}` : ""}`}
                    subtitle={`${c.title} · ${c.store.name}`}
                    onPress={() => go(`/cupom/${c.id}`)}
                  />
                ))}
              </>
            ) : null}
            {events.length ? (
              <>
                <SectionHeader title="Eventos" />
                {events.map((ev) => (
                  <ResultRow
                    key={ev.id}
                    leading={
                      ev.imageUrl ? (
                        <Photo
                          source={mediaUrl(ev.imageUrl)}
                          recyclingKey={ev.id}
                          displayWidth={PHOTO_SIZE}
                          style={styles.photo}
                        />
                      ) : (
                        <MonoTile icon={eventIcon(ev)} color={toneOf(ev.tone).gradient[1]} />
                      )
                    }
                    title={ev.title}
                    subtitle={`${occurrenceLabel(ev, ev.date, today)} · ${ev.place}`}
                    onPress={() => go(`/evento/${ev.id}`)}
                  />
                ))}
              </>
            ) : null}
            {views[0] !== "ready" || views[1] !== "ready" || views[2] !== "ready" ? (
              <Text variant="small" tone="textMuted" align="center" style={styles.note}>
                Parte da busca não carregou agora.
              </Text>
            ) : null}
          </>
        )}
        <BottomSpacer kind="safe" />
      </ScrollView>
    </ScreenContainer>
  );
}

function SearchSkeleton() {
  return (
    <View style={styles.skeleton}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={PHOTO_SIZE} height={PHOTO_SIZE} radius={15} />
          <View style={styles.skeletonText}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: layout.gutter,
    paddingBottom: 4,
  },
  field: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: layout.gutter },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 15 },
  skeleton: { paddingTop: 20, gap: 4 },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: layout.gutter,
  },
  skeletonText: { flex: 1, gap: 6 },
  note: { marginTop: 16, paddingHorizontal: layout.gutter },
});
