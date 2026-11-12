import { useRouter } from "expo-router";
import { type ReactNode, useRef } from "react";
import { ScrollView, type ScrollViewInstance, StyleSheet, View } from "react-native";
import { useSession } from "@/core/auth/session";
import {
  BottomSpacer,
  EmptyState,
  IconButton,
  layout,
  ScreenContainer,
  Skeleton,
  Text,
} from "@/design";
import {
  ClubHero,
  ClubSealGrid,
  daysUntil,
  PendingRedemptions,
  PrizeList,
  RankingCard,
  useClub,
} from "@/features/club";
import { HomeBackButton, WalletButton } from "@/navigation/HeaderButtons";
import { useNow } from "@/shared/hooks/useNow";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useChallenges } from "../api/challenges";
import { ChallengeRow } from "../components/ChallengeRow";
import { openChallengeSheet } from "../sheets/challenge-sheet";

type Section = "seals" | "challenges" | "prizes";

/**
 * Aba Clube ARP (/desafios): Trevos, selos (categorias colecionáveis com o
 * histórico), desafios do mês, lojinha (troca no app, retirada no Mercado
 * Local) e ranking.
 */
export default function ChallengesScreen() {
  const router = useRouter();
  const signedIn = useSession((s) => s.status) === "signedIn";
  const query = useChallenges();
  const club = useClub();
  const now = useNow(60 * 60_000);
  const { data } = query;
  const refreshControl = useRefreshControl(async () => {
    await Promise.all([query.refetch(), club.refetch()]);
  });
  const view = queryView(club);
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Partial<Record<Section, number>>>({});
  const mark = (key: Section) => (e: { nativeEvent: { layout: { y: number } } }) => {
    offsets.current[key] = e.nativeEvent.layout.y;
  };
  const goTo = (key: Section) => () =>
    scroll.current?.scrollTo({ y: Math.max(0, (offsets.current[key] ?? 0) - 12), animated: true });

  let body: ReactNode;
  if (view !== "ready" || !club.data) {
    body = (
      <QueryFallback
        view={view === "ready" ? "loading" : view}
        skeleton={<ChallengesSkeleton />}
        error={club.error}
        onRetry={() => void club.refetch()}
        retrying={club.isFetching}
      />
    );
  } else {
    const { points, seals, prizes, ranking, pendingRedemptions } = club.data;
    const challenges = data?.challenges ?? [];
    const campaign = data?.campaign ?? null;
    const left = campaign ? daysUntil(campaign.endsAt, now) : 0;
    const total = seals.reduce((n, s) => n + s.times, 0);
    body = (
      <>
        <ClubHero
          points={signedIn ? points : null}
          chips={
            campaign
              ? [
                  {
                    icon: "calendar-days",
                    label: campaign.name,
                    onPress: goTo("challenges"),
                    accessibilityLabel: `${campaign.name}: ver a lista do mês`,
                  },
                  {
                    icon: "clock",
                    label:
                      left === 0 ? "termina hoje" : `faltam ${left} ${left === 1 ? "dia" : "dias"}`,
                  },
                ]
              : []
          }
          onSeals={goTo("seals")}
          onRewards={goTo("prizes")}
        />
        {signedIn && pendingRedemptions.length > 0 ? (
          <>
            <SectionTitle title="Para retirar" />
            <PendingRedemptions items={pendingRedemptions} />
          </>
        ) : null}
        <View onLayout={mark("seals")}>
          <SectionTitle
            title="Meus selos"
            right={signedIn ? `${total} ${total === 1 ? "selo" : "selos"}` : undefined}
          />
        </View>
        <ClubSealGrid seals={seals} signedIn={signedIn} />
        <View onLayout={mark("challenges")}>
          <SectionTitle title={campaign?.name ?? "Desafios do mês"} />
        </View>
        {challenges.length > 0 ? (
          <View style={styles.list}>
            {challenges.map((c) => (
              <ChallengeRow
                key={c.id}
                challenge={c}
                done={signedIn && c.earned && !c.repeatable}
                onPress={() => openChallengeSheet(c)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="award"
            title="Nenhum desafio no ar agora"
            text="Novos desafios chegam em breve"
          />
        )}
        <View onLayout={mark("prizes")}>
          <SectionTitle title="Lojinha de prêmios" />
        </View>
        <PrizeList prizes={prizes} total={signedIn ? (points?.total ?? 0) : null} />
        <SectionTitle title="Ranking" />
        <RankingCard ranking={ranking} signedIn={signedIn} />
        <Text
          variant="small"
          tone="brandText"
          weight={700}
          align="center"
          accessibilityRole="link"
          onPress={() => router.push({ pathname: "/texto/[key]", params: { key: "club_rules" } })}
          style={styles.foot}
        >
          Regulamento do Clube ARP
        </Text>
      </>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView ref={scroll} refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <HomeBackButton />
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            Clube ARP
          </Text>
          <WalletButton />
          <IconButton
            icon="scan-line"
            variant="dark"
            accessibilityLabel="Ler QR Code"
            onPress={() => router.push("/ler-qr")}
          />
        </View>
        {body}
        <BottomSpacer />
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <View style={styles.secH}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {right ? (
        <Text variant="small" tone="textMuted">
          {right}
        </Text>
      ) : null}
    </View>
  );
}

function ChallengesSkeleton() {
  return (
    <View>
      <Skeleton height={290} radius={32} style={styles.heroSk} />
      <View style={styles.secH}>
        <Skeleton width={130} height={20} />
      </View>
      <View style={styles.gridSk}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={118} radius={24} style={styles.cellSk} />
        ))}
      </View>
      <View style={styles.secH}>
        <Skeleton width={160} height={20} />
      </View>
      <View style={styles.list}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={78} radius={24} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: layout.gutter,
  },
  title: { flex: 1 },
  secH: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: layout.sectionTop,
    marginBottom: layout.sectionBottom,
    marginHorizontal: layout.gutter,
  },
  list: { gap: 10, paddingHorizontal: layout.gutter },
  foot: { marginTop: 22, marginHorizontal: 30 },
  heroSk: { marginTop: 18, marginHorizontal: layout.gutter, width: "auto" },
  gridSk: { flexDirection: "row", gap: 10, paddingHorizontal: layout.gutter },
  cellSk: { flex: 1, width: "auto" },
});
