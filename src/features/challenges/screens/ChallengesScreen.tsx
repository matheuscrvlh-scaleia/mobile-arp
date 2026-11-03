import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
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
import { ClubHero, ClubSealGrid, PrizeList, RankingCard, useClub } from "@/features/club";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useChallenges } from "../api/challenges";
import { ChallengeRow } from "../components/ChallengeRow";
import { openChallengeSheet } from "../sheets/challenge-sheet";

/**
 * Aba Clube ARP (/desafios), Fase 2: pontos, selos com validade, desafios,
 * lojinha e ranking. Sem coleção do mês nem faixas de benefício.
 */
export default function ChallengesScreen() {
  const router = useRouter();
  const signedIn = useSession((s) => s.status) === "signedIn";
  const query = useChallenges();
  const club = useClub();
  const { data } = query;
  const refreshControl = useRefreshControl(async () => {
    await Promise.all([query.refetch(), club.refetch()]);
  });
  const view = queryView(club);

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
    const { points, seals, prizes, ranking } = club.data;
    const challenges = data?.challenges ?? [];
    body = (
      <>
        <ClubHero points={signedIn ? points : null} />
        <Section title="Seus selos" />
        <ClubSealGrid seals={seals} />
        <Section title="Desafios" />
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
        <Section title="Lojinha" />
        <PrizeList prizes={prizes} total={signedIn ? (points?.total ?? 0) : null} />
        <Section title="Ranking" />
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
    <ScreenContainer scroll scrollProps={{ refreshControl }}>
      <View style={styles.top}>
        <Text variant="title" accessibilityRole="header">
          Clube ARP
        </Text>
        <IconButton
          icon="scan-line"
          variant="dark"
          accessibilityLabel="Ler QR Code"
          onPress={() => router.push("/ler-qr")}
        />
      </View>
      {body}
      <BottomSpacer />
    </ScreenContainer>
  );
}

function Section({ title }: { title: string }) {
  return (
    <View style={styles.secH}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.gutter,
  },
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
