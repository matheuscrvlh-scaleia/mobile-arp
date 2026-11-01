import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { useSession } from "@/core/auth/session";
import { BottomSpacer, EmptyState, NavHeader, ScreenContainer } from "@/design";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useFavoriteStores } from "../api/stores";
import { StoreCard } from "../components/StoreCard";
import { StoreGridCell } from "../components/StoreGridCell";
import { StoreGridSkeleton } from "../components/StoreGridStates";

/** Lojas favoritas (/favoritos). Pede conta. */
export default function FavoritesScreen() {
  const router = useRouter();
  const status = useSession((s) => s.status);
  const query = useFavoriteStores();
  const view = queryView(query);
  const refreshControl = useRefreshControl(query.refetch);

  const header = <NavHeader title="Favoritas" style={styles.header} />;

  if (status === "guest") {
    return (
      <ScreenContainer top="none">
        {header}
        <EmptyState
          icon="heart"
          title="Entre para ver suas favoritas"
          text="Com a conta, as lojas que você favorita ficam juntas aqui, em qualquer aparelho."
          action={{ label: "Entrar", onPress: () => router.push("/entrar") }}
        />
      </ScreenContainer>
    );
  }

  const empty =
    status === "restoring" ? (
      <StoreGridSkeleton />
    ) : view !== "ready" ? (
      <QueryFallback
        view={view}
        skeleton={<StoreGridSkeleton />}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    ) : (
      <EmptyState
        icon="heart"
        title="Você ainda não favoritou lojas"
        text="Toque no coração de uma loja para guardá-la aqui."
        action={{ label: "Explorar lojas", variant: "soft", onPress: () => router.push("/lojas") }}
      />
    );

  return (
    <ScreenContainer top="none">
      <FlashList
        data={query.data ?? []}
        numColumns={2}
        keyExtractor={(s) => s.id}
        renderItem={({ item, index }) => (
          <StoreGridCell index={index}>
            <StoreCard store={item} />
          </StoreGridCell>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={<BottomSpacer kind="safe" />}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
});
