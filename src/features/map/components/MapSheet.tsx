import { ScrollView, View } from "react-native";
import type { StoreDetail, StoreSummary } from "@/contracts/app/stores";
import { STORE_KIND_LABEL } from "@/contracts/directory";
import { errorMessage } from "@/core/api/errors";
import { mediaUrl } from "@/core/api/media";
import {
  Button,
  Chip,
  createStyles,
  ErrorState,
  layout,
  Photo,
  Skeleton,
  Text,
  useColors,
  useTabBarInset,
  withAlpha,
} from "@/design";
import { MonoTile, ResultRow, STORE_KIND_OPTIONS, storeLocation } from "@/features/stores";
import type { QueryView } from "@/shared/query/query-view";
import { type MapCategory, type MapFloor, type MapPin, matchesPin } from "../lib/map-geometry";

const CHIPS = [
  { value: "all", label: "Tudo", icon: "layout-grid" } as const,
  ...STORE_KIND_OPTIONS,
];

type Props = {
  floor: MapFloor | undefined;
  floors: readonly MapFloor[];
  selected: MapPin | null;
  selectedStore: StoreDetail | StoreSummary | undefined;
  stores: Map<string, StoreSummary> | undefined;
  category: MapCategory;
  q: string;
  /** Estado da consulta do mapa (skeleton, sem conexão ou erro com retry). */
  view: QueryView;
  error: unknown;
  retrying: boolean;
  onRetry: () => void;
  onCategory: (c: MapCategory) => void;
  onSelect: (pin: MapPin, floorId: string) => void;
  onOpenStore: (slug: string) => void;
};

function subtitle(pin: MapPin, store: StoreSummary | undefined): string {
  return store
    ? `${store.category.name} · ${storeLocation(store, { short: true })}`
    : STORE_KIND_LABEL[pin.kind];
}

function Leading({
  pin,
  store,
  size = 44,
}: {
  pin: MapPin;
  store: StoreSummary | undefined;
  size?: number;
}) {
  const styles = useStyles();
  const photo = mediaUrl(store?.coverImageUrl);
  if (photo) {
    return (
      <Photo
        source={photo}
        recyclingKey={pin.storeId}
        displayWidth={size}
        style={[styles.photo, { width: size, height: size, borderRadius: size / 2.9 }]}
      />
    );
  }
  return <MonoTile icon={pin.icon} color={pin.brandColor} size={size} />;
}

/** Painel fixo do mapa (.map-sheet): filtro ou loja escolhida, lugares do andar e referências. */
export function MapSheet({
  floor,
  floors,
  selected,
  selectedStore,
  stores,
  category,
  q,
  view,
  error,
  retrying,
  onRetry,
  onCategory,
  onSelect,
  onOpenStore,
}: Props) {
  const c = useColors();
  const styles = useStyles();
  const { clearance } = useTabBarInset();
  const here = floor ? floor.pins.filter((p) => matchesPin(p, category, q)) : [];
  const others = q.trim()
    ? floors.flatMap((f) =>
        f.id === floor?.id
          ? []
          : f.pins.filter((p) => matchesPin(p, "all", q)).map((pin) => ({ pin, floor: f })),
      )
    : [];
  const showPoints = !q.trim() && category === "all";

  return (
    <View style={styles.sheet}>
      <View style={styles.grab} />
      {selected ? (
        <View style={styles.selCard}>
          <Leading pin={selected} store={selectedStore} size={50} />
          <View style={styles.selText}>
            <Text variant="h4" weight={700} tone="onChrome" numberOfLines={1}>
              {selected.name}
            </Text>
            <Text variant="small" tone="onChromeMuted" numberOfLines={1}>
              {subtitle(selected, selectedStore)}
            </Text>
          </View>
          <Button
            label="Ver loja"
            variant="brand"
            size="sm"
            onPress={() => onOpenStore(selected.slug)}
            style={styles.selBtn}
          />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsWrap}
        >
          {CHIPS.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              icon={c.icon}
              on={category === c.value}
              onPress={() => onCategory(c.value)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: clearance }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === "loading" ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={44} height={44} radius={15} />
              <View style={styles.skeletonText}>
                <Skeleton width="55%" height={14} />
                <Skeleton width="35%" height={12} />
              </View>
            </View>
          ))
        ) : view !== "ready" ? (
          <ErrorState
            compact
            offline={view === "offline"}
            message={view === "error" ? errorMessage(error) : undefined}
            onRetry={onRetry}
            retrying={retrying}
          />
        ) : (
          <>
            {floor
              ? here.map((pin) => (
                  <ResultRow
                    key={pin.storeId}
                    leading={<Leading pin={pin} store={stores?.get(pin.storeId)} />}
                    title={pin.name}
                    subtitle={subtitle(pin, stores?.get(pin.storeId))}
                    selected={pin.storeId === selected?.storeId}
                    onPress={() => onSelect(pin, floor.id)}
                  />
                ))
              : null}
            {others.map(({ pin, floor: f }) => (
              <ResultRow
                key={pin.storeId}
                leading={<Leading pin={pin} store={stores?.get(pin.storeId)} />}
                title={pin.name}
                subtitle={`Fica no ${f.label} · toque para ir`}
                trailingIcon="arrow-up-down"
                onPress={() => onSelect(pin, f.id)}
              />
            ))}
            {showPoints && floor
              ? floor.points.map((pt) => (
                  <ResultRow
                    key={pt.id}
                    leading={<MonoTile icon={pt.icon} color={c.inverse} iconColor={c.onInverse} />}
                    title={pt.label}
                    subtitle="Ponto de referência"
                  />
                ))
              : null}
            {!here.length && !others.length ? (
              <Text variant="small" tone="textMuted" align="center" style={styles.none}>
                {q.trim()
                  ? "Nenhuma loja com esse nome."
                  : "Nenhum lugar com esse filtro neste andar."}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  sheet: {
    flex: 1,
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    boxShadow: t.dark
      ? `0 -10px 30px -14px ${withAlpha(t.colors.scrim, 0.7)}, inset 0 1px 0 ${withAlpha(t.colors.onMedia, 0.07)}`
      : `0 -10px 30px -14px ${withAlpha(t.colors.scrim, 0.2)}`,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.dark ? t.colors.borderStrong : t.colors.border,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  chipsWrap: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: layout.gutter },
  selCard: {
    marginHorizontal: layout.gutter,
    marginBottom: 6,
    padding: 14,
    borderRadius: 24,
    backgroundColor: t.colors.chrome,
    // no escuro o chrome ganha o fio claro (chromeBorder)
    boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}`,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selText: { flex: 1, minWidth: 0 },
  selBtn: { height: 42, borderRadius: 21, paddingHorizontal: 16, alignSelf: "center" },
  photo: t.shadows.hairline,
  list: { flex: 1 },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: layout.gutter,
  },
  skeletonText: { flex: 1, gap: 6 },
  none: { paddingVertical: 16, paddingHorizontal: layout.gutter },
}));
