import { useLocalSearchParams } from "expo-router";
import { ScrollView, Share, View } from "react-native";
import type { StoreDetail } from "@/contracts/app/stores";
import { isApiError } from "@/core/api/errors";
import {
  Button,
  CtaBar,
  createStyles,
  EmptyState,
  IconButton,
  layout,
  NavHeader,
  ScreenContainer,
  Skeleton,
  SkeletonText,
  Switch,
  Text,
  tracking,
  useColors,
  useCtaBarHeight,
  useTopInset,
} from "@/design";
import { ChallengeCallout } from "@/features/challenges";
import { CouponCard } from "@/features/coupons";
import { goBackOr, openPath } from "@/navigation/navigate";
import { useNow } from "@/shared/hooks/useNow";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useToggleFavorite, useToggleFollow } from "../api/favorites";
import { useStore } from "../api/stores";
import { InfoTile } from "../components/InfoTile";
import { OpenDot } from "../components/OpenDot";
import { COVER_HEIGHT, StoreCover } from "../components/StoreCover";
import { contactOptions } from "../lib/contact";
import { formatHoursToday, HOURS_NOTICE, openStatus } from "../lib/hours";
import { storeLocation } from "../lib/location";
import { openContactSheet, openHoursSheet } from "../sheets/StoreSheets";

const back = () => goBackOr("/");

/** Página da loja (/loja/[slug]; links antigos com id também abrem). */
export default function StoreDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useStore(slug ?? "");
  const view = queryView(query);

  if (query.data) {
    return (
      <StoreDetailBody
        store={query.data}
        partial={query.isPlaceholderData}
        refetch={query.refetch}
      />
    );
  }

  if (view === "loading") return <StoreDetailSkeleton />;

  const notFound = isApiError(query.error) && query.error.code === "NOT_FOUND";
  return (
    <ScreenContainer top="none">
      <NavHeader />
      {notFound ? (
        <EmptyState
          icon="store"
          title="Loja não encontrada"
          text="Ela pode ter saído da ARP ou mudado de endereço no app."
          action={{ label: "Explorar lojas", variant: "soft", onPress: () => openPath("/lojas") }}
        />
      ) : view !== "ready" ? (
        <QueryFallback
          view={view}
          skeleton={null}
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
    </ScreenContainer>
  );
}

function StoreDetailBody({
  store,
  partial,
  refetch,
}: {
  store: StoreDetail;
  /** Montada de um resumo em cache: horários, contato e cupons ainda carregando. */
  partial: boolean;
  refetch: () => Promise<unknown>;
}) {
  const styles = useStyles();
  const now = new Date(useNow(60_000));
  const toggleFavorite = useToggleFavorite();
  const toggleFollow = useToggleFollow();
  const ctaHeight = useCtaBarHeight();
  const refreshControl = useRefreshControl(refetch);
  const status = partial
    ? { open: store.isOpenNow, label: store.isOpenNow ? "Aberto agora" : "Fechado agora" }
    : openStatus(store.hours, now);
  const hasContact = contactOptions(store).length > 0;
  const where = storeLocation(store);
  const hoursToday = formatHoursToday(store.hours, now);
  // como no protótipo (go "root"): volta para a aba Mapa já aberta, sem empilhar outra
  const goToMap = () => openPath(`/mapa?loja=${store.slug}`);

  const share = () => {
    void Share.share({
      message: `${store.name} na ARP · ${store.category.name}, ${store.floor.label}\narp://loja/${store.slug}`,
    }).catch(() => undefined);
  };

  return (
    <ScreenContainer top="none" statusBar="light">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ctaHeight + 20 }}
        refreshControl={refreshControl}
      >
        <StoreCover
          store={store}
          onBack={back}
          onShare={share}
          onFavorite={() => toggleFavorite(store)}
        />
        <View style={styles.body}>
          <Text variant="title" accessibilityRole="header" style={styles.name}>
            {store.name}
          </Text>
          <View style={styles.cat}>
            <Text variant="body" tone="textMuted">
              {[store.category, ...store.extraCategories].map((c) => c.name).join(" · ")}
            </Text>
            <OpenDot open={status.open} label={status.label} />
          </View>
          {partial ? (
            <SkeletonText lines={3} style={styles.desc} />
          ) : store.description ? (
            <Text variant="body" tone="textSecondary" style={styles.desc}>
              {store.description}
            </Text>
          ) : null}

          {partial ? (
            <InfoGridSkeleton />
          ) : (
            <View style={styles.grid}>
              <View style={styles.row}>
                <InfoTile
                  dark
                  icon="map-pin"
                  label="Onde fica · ver no mapa"
                  value={where}
                  onPress={goToMap}
                  accessibilityLabel={`Onde fica: ${where}. Ver no mapa`}
                />
                <InfoTile
                  icon="clock"
                  label="Horário de hoje · ver semana"
                  value={hoursToday}
                  onPress={() => openHoursSheet(store)}
                  accessibilityLabel={`Horário de hoje: ${hoursToday}. Ver a semana`}
                />
              </View>
              <View style={styles.row}>
                <InfoTile
                  icon="message-circle"
                  label="Contato"
                  value={hasContact ? "Falar com a loja" : "Não informado"}
                  onPress={hasContact ? () => openContactSheet(store) : undefined}
                  accessibilityLabel={hasContact ? "Falar com a loja" : "Contato não informado"}
                />
                <InfoTile icon="bell-ring" label="Avisar ofertas">
                  <View style={styles.switch}>
                    <Switch
                      value={store.isFollowing}
                      onValueChange={() => toggleFollow(store)}
                      accessibilityLabel="Avisar ofertas"
                    />
                  </View>
                </InfoTile>
              </View>
              <Text variant="caption" tone="textMuted" style={styles.hoursNote}>
                {HOURS_NOTICE}
              </Text>
            </View>
          )}

          {store.challenge ? (
            <View style={styles.challenge}>
              <ChallengeCallout challenge={store.challenge} />
            </View>
          ) : null}

          {store.coupons.length ? (
            <>
              <Text variant="h2" accessibilityRole="header" style={styles.secTitle}>
                Cupons da loja
              </Text>
              <View style={styles.coupons}>
                {store.coupons.map((c) => (
                  <CouponCard key={c.id} coupon={c} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
      <CtaBar>
        <Button
          label={`Ver no mapa · ${store.floor.label}`}
          iconLeft="map-pin"
          variant="dark"
          onPress={goToMap}
        />
      </CtaBar>
    </ScreenContainer>
  );
}

function InfoGridSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <Skeleton height={92} radius={20} style={styles.flex} />
        <Skeleton height={92} radius={20} style={styles.flex} />
      </View>
      <View style={styles.row}>
        <Skeleton height={92} radius={20} style={styles.flex} />
        <Skeleton height={92} radius={20} style={styles.flex} />
      </View>
    </View>
  );
}

function StoreDetailSkeleton() {
  const c = useColors();
  const styles = useStyles();
  const top = useTopInset("header");
  return (
    <ScreenContainer top="none" statusBar="light">
      <Skeleton height={COVER_HEIGHT} radius={0} color={c.surfaceStrong} />
      <View style={[styles.skeletonBack, { top }]}>
        <IconButton
          icon="chevron-left"
          variant="glass"
          accessibilityLabel="Voltar"
          onPress={back}
        />
      </View>
      <View style={[styles.body, styles.skeletonBody]}>
        <Skeleton width="60%" height={30} radius={10} />
        <Skeleton width="45%" height={14} />
        <SkeletonText lines={3} style={styles.desc} />
        <InfoGridSkeleton />
      </View>
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  body: {
    backgroundColor: t.colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingTop: 22,
    paddingHorizontal: layout.gutter,
  },
  skeletonBody: { gap: 10 },
  skeletonBack: { position: "absolute", left: layout.gutter },
  name: { fontSize: 30, lineHeight: 34, letterSpacing: tracking(30, -0.04) },
  cat: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2, flexWrap: "wrap" },
  desc: { lineHeight: 23, marginTop: 16 },
  grid: { gap: 10, marginTop: 18 },
  row: { flexDirection: "row", gap: 10 },
  hoursNote: { paddingHorizontal: 4 },
  flex: { flex: 1 },
  switch: { marginTop: 4, alignSelf: "flex-start" },
  challenge: { marginTop: 18 },
  secTitle: { marginTop: 26, marginBottom: 12 },
  coupons: { gap: 14 },
}));
