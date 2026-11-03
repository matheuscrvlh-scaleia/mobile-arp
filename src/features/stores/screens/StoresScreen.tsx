import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import type { StoreKind } from "@/contracts/directory";
import {
  BottomSpacer,
  Chip,
  createStyles,
  EmptyState,
  IconButton,
  layout,
  NavHeader,
  ScreenContainer,
  SearchField,
  Segmented,
  Spinner,
  Text,
  useColors,
} from "@/design";
import { openPath } from "@/navigation/navigate";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useStoreCategories, useStoresInfinite } from "../api/stores";
import { StoreCard } from "../components/StoreCard";
import { StoreGridCell } from "../components/StoreGridCell";
import { StoreGridSkeleton } from "../components/StoreGridStates";
import { parseStoreKind, STORE_KIND_OPTIONS } from "../lib/kinds";
import { storeFilters } from "../lib/store-filters";

const PLACEHOLDER: Record<StoreKind, string> = {
  shop: "Moda, acessórios, utilidades…",
  food: "Restaurantes, cafés, bares…",
  service: "Saúde, beleza, escritórios…",
};

/** Busca da API: acima disso ela recusa (400). */
const QUERY_MAX = 120;
const DEBOUNCE_MS = 450;

/** Explorar (/lojas?tipo=shop|food|service&categoria=<id>&q=<busca>). */
export default function StoresScreen() {
  const c = useColors();
  const styles = useStyles();
  const params = useLocalSearchParams<{ tipo?: string; categoria?: string; q?: string }>();
  const [kind, setKind] = useState<StoreKind>(parseStoreKind(params.tipo));
  const [categoryId, setCategoryId] = useState<string | null>(params.categoria ?? null);
  const [text, setText] = useState(params.q ?? "");
  const [openNow, setOpenNow] = useState(false);
  const q = useDebouncedValue(text.trim(), DEBOUNCE_MS);

  const categories = useStoreCategories();
  const kindCategories = (categories.data ?? []).filter((c) => c.kind === kind);
  // "Aberto agora" é filtro da API: a paginação segue normal e só traz as abertas
  const query = useStoresInfinite(storeFilters({ kind, categoryId, q, openNow }));
  const view = queryView(query);
  const stores = query.data?.pages.flatMap((p) => p.data) ?? [];
  const refreshControl = useRefreshControl(query.refetch);

  const {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
  } = query;
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  };

  const changeKind = (next: StoreKind) => {
    setKind(next);
    setCategoryId(null);
    setText("");
  };

  const header = (
    <View style={styles.header}>
      <NavHeader
        right={
          <IconButton
            icon="map"
            accessibilityLabel="Ver no mapa"
            onPress={() => openPath("/mapa")}
          />
        }
      />
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Explorar
      </Text>
      <View style={styles.segm}>
        <Segmented options={STORE_KIND_OPTIONS} value={kind} onChange={changeKind} />
      </View>
      <View style={styles.pad}>
        <SearchField
          value={text}
          onChangeText={setText}
          placeholder={PLACEHOLDER[kind]}
          autoCapitalize="none"
          maxLength={QUERY_MAX}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled"
      >
        <Chip
          label="Aberto agora"
          icon="clock"
          on={openNow}
          onPress={() => setOpenNow(!openNow)}
          accessibilityLabel="Só lojas abertas agora"
        />
        <View style={styles.chipSep} />
        <Chip label="Todos" on={categoryId === null} onPress={() => setCategoryId(null)} />
        {kindCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            on={categoryId === c.id}
            onPress={() => setCategoryId(c.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const empty =
    view !== "ready" ? (
      <QueryFallback
        view={view}
        skeleton={<StoreGridSkeleton />}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    ) : openNow ? (
      <EmptyState
        icon="clock"
        title="Nenhuma aberta agora"
        text="Nada aberto com esses filtros neste horário."
        action={{ label: "Ver todas", variant: "soft", onPress: () => setOpenNow(false) }}
      />
    ) : (
      <EmptyState icon="search-x" title="Nada encontrado" text="Tente outro nome ou categoria." />
    );

  const footer = (
    <>
      {isFetchingNextPage && stores.length ? (
        <View style={styles.more}>
          <Spinner color={c.textMuted} />
        </View>
      ) : null}
      <BottomSpacer kind="safe" />
    </>
  );

  return (
    <ScreenContainer top="none">
      <FlashList
        data={stores}
        numColumns={2}
        keyExtractor={(s) => s.id}
        renderItem={({ item, index }) => (
          <StoreGridCell index={index}>
            <StoreCard store={item} dark={index === 0 && !q && !hasPreviousPage} />
          </StoreGridCell>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        // a lista guarda 5 páginas: as primeiras voltam ao subir
        onStartReached={() => {
          if (hasPreviousPage && !isFetchingPreviousPage) void fetchPreviousPage();
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  header: { paddingBottom: 16 },
  title: { marginTop: 14, paddingHorizontal: layout.gutter },
  segm: { marginTop: 16, paddingHorizontal: layout.gutter },
  pad: { marginTop: 12, paddingHorizontal: layout.gutter },
  chips: { gap: 8, paddingHorizontal: layout.gutter, marginTop: 12, alignItems: "center" },
  chipSep: { width: 1, height: 24, backgroundColor: t.colors.border },
  more: { marginVertical: 16, alignItems: "center" },
}));
