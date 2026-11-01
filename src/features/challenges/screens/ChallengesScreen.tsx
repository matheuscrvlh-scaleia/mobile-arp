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
import { useNow } from "@/shared/hooks/useNow";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { monthName } from "@/shared/lib/format";
import { MINUTE_MS } from "@/shared/lib/time";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useChallenges } from "../api/challenges";
import { ChallengeRow } from "../components/ChallengeRow";
import { ChallengesHero } from "../components/ChallengesHero";
import { SealGrid } from "../components/SealGrid";
import { campaignLabel, daysLeft, daysLeftLabel } from "../lib/progress";
import { openChallengeSheet } from "../sheets/challenge-sheet";

/** Aba Selos (/desafios): progresso do mês, coleção e lista de desafios. */
export default function ChallengesScreen() {
  const router = useRouter();
  const signedIn = useSession((s) => s.status) === "signedIn";
  const query = useChallenges();
  const { data } = query;
  const now = useNow(MINUTE_MS);
  const refreshControl = useRefreshControl(query.refetch);
  const view = queryView(query);

  let body: ReactNode;
  if (view !== "ready" || !data) {
    body = (
      <QueryFallback
        view={view === "ready" ? "loading" : view}
        skeleton={<ChallengesSkeleton />}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  } else if (!data.campaign) {
    body = (
      <EmptyState
        icon="award"
        title="Nenhum desafio no ar agora"
        text="Novos desafios chegam em breve"
      />
    );
  } else {
    const { campaign, challenges, progress } = data;
    const earned = signedIn ? progress.earned : 0;
    body = (
      <>
        <ChallengesHero
          campaignLabel={campaignLabel(campaign.name || monthName(campaign.startsAt))}
          daysLabel={daysLeftLabel(daysLeft(campaign.endsAt, now))}
          progress={progress}
          signedIn={signedIn}
        />
        <View style={styles.secH}>
          <Text variant="h2" accessibilityRole="header">
            Sua coleção
          </Text>
          <Text variant="small" tone="textMuted" tabular>
            {earned}/{progress.total}
          </Text>
        </View>
        <SealGrid challenges={challenges} signedIn={signedIn} />
        <View style={styles.secH}>
          <Text variant="h2" accessibilityRole="header">
            Desafios do mês
          </Text>
        </View>
        <View style={styles.list}>
          {challenges.map((c) => (
            <ChallengeRow
              key={c.id}
              challenge={c}
              done={signedIn && c.earned}
              onPress={() => openChallengeSheet(c)}
            />
          ))}
        </View>
        <Text variant="caption" weight={400} tone="textMuted" align="center" style={styles.foot}>
          A ARP define as recompensas de cada mês.
        </Text>
      </>
    );
  }

  return (
    <ScreenContainer scroll scrollProps={{ refreshControl }}>
      <View style={styles.top}>
        <Text variant="title" accessibilityRole="header">
          Selos
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
  foot: { fontSize: 12, marginTop: 18, marginHorizontal: 30 },
  heroSk: { marginTop: 18, marginHorizontal: layout.gutter, width: "auto" },
  gridSk: { flexDirection: "row", gap: 10, paddingHorizontal: layout.gutter },
  cellSk: { flex: 1, width: "auto" },
});
