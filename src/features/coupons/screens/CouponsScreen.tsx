import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { CouponCard as CouponCardData } from "@/contracts/app/coupons";
import { useSession } from "@/core/auth/session";
import {
  BottomSpacer,
  Chip,
  EmptyState,
  IconButton,
  layout,
  ScreenContainer,
  SkeletonCard,
  Spinner,
  Text,
  useColors,
  useTopInset,
} from "@/design";
import { HomeBackButton, WalletButton } from "@/navigation/HeaderButtons";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useCoupons } from "../api/coupons";
import { CouponCard } from "../components/CouponCard";
import { WalletStrip } from "../components/WalletStrip";
import { COUPON_FILTERS, type CouponFilter, couponQueryFor, filterCoupons } from "../lib/filters";
import { soldOutLast } from "../lib/stock";

export default function CouponsScreen() {
  const router = useRouter();
  const colors = useColors();
  const paddingTop = useTopInset("content");
  const signedIn = useSession((s) => s.status === "signedIn");
  const [filter, setFilter] = useState<CouponFilter>("all");
  const query = useCoupons(couponQueryFor(filter));

  const all = query.data?.pages.flatMap((p) => p.data) ?? [];
  const list = soldOutLast(filterCoupons(filter, all));
  const refreshControl = useRefreshControl(query.refetch);

  const header = (
    <View style={{ paddingTop }}>
      <View style={styles.pad}>
        <View style={styles.titleRow}>
          <HomeBackButton />
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            Cupons
          </Text>
          <WalletButton />
        </View>
        <Text variant="muted" style={styles.lead}>
          Pegue, mostre no caixa e use dentro do prazo. Não usou? Ele volta pra vitrine.
        </Text>
      </View>
      {signedIn ? <WalletStrip /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
      >
        {COUPON_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            icon={f.icon}
            on={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const view = queryView(query);
  let empty: ReactElement;
  if (view !== "ready") {
    empty = (
      <QueryFallback
        view={view}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        skeleton={
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        }
      />
    );
  } else {
    empty = <EmptyState icon="ticket" title="Nenhum cupom aqui" text="Volte mais tarde." />;
  }

  return (
    <ScreenContainer top="none">
      <FlashList<CouponCardData>
        data={list}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <CouponCard coupon={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <>
            {query.isFetchingNextPage ? (
              <View style={styles.more}>
                <Spinner color={colors.textMuted} />
              </View>
            ) : null}
            <BottomSpacer />
          </>
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        // só 5 páginas ficam em memória (maxPages): as de cima voltam ao subir
        onStartReached={() => {
          if (query.hasPreviousPage && !query.isFetchingPreviousPage) {
            void query.fetchPreviousPage();
          }
        }}
        onStartReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: layout.gutter },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1 },
  lead: { marginTop: 8, lineHeight: 22 },
  chips: { marginTop: 18, marginBottom: 16, flexGrow: 0 },
  chipsContent: { gap: 8, paddingHorizontal: layout.gutter },
  item: { paddingHorizontal: layout.gutter, paddingBottom: 14 },
  skeletons: { paddingHorizontal: layout.gutter, gap: 14 },
  more: { paddingVertical: 16, alignItems: "center" },
});
