import { Image } from "expo-image";
import { useWindowDimensions, View } from "react-native";
import type { Club, ClubPrize, ClubSeal } from "@/contracts/app/club";
import { PRIZE_KIND_LABEL } from "@/contracts/gamification";
import { Button, createStyles, Icon, layout, Pill, SealBadge, Text, useColors } from "@/design";
import { requireAuth } from "@/features/auth";
import { formatPoints, sealStateLabel } from "../lib/club";
import {
  openJoinRankingSheet,
  openLeaveRankingSheet,
  openRedeemSheet,
} from "../sheets/club-sheets";

const COLS = 3;
const GAP = 10;

/** Selos do Clube: valendo ("vence dd/mm"), vencidos ("venceu dd/mm") e os que faltam ("+N pontos"). */
export function ClubSealGrid({ seals }: { seals: readonly ClubSeal[] }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - layout.gutter * 2 - GAP * (COLS - 1)) / COLS);
  return (
    <View style={styles.grid}>
      {seals.map((s) => {
        const active = s.state === "active";
        const label = sealStateLabel(s);
        return (
          <View
            key={s.seal.id}
            style={[styles.seal, { width: cell }]}
            accessible
            accessibilityLabel={`Selo ${s.seal.name}, ${label}${s.repeatable ? ", repetível" : ""}`}
          >
            <SealBadge seal={s.seal} size={60} locked={!active} />
            <Text
              variant="smallStrong"
              weight={650}
              align="center"
              numberOfLines={2}
              tone={active ? "text" : "textMuted"}
            >
              {s.seal.name}
            </Text>
            <Text
              variant="caption"
              align="center"
              tone={s.state === "expired" ? "dangerText" : active ? "brandText" : "textMuted"}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Lojinha: prêmios com "Trocar" ou "Faltam N". */
export function PrizeList({
  prizes,
  total,
}: {
  prizes: readonly ClubPrize[];
  /** null sem login. */
  total: number | null;
}) {
  const styles = useStyles();
  const colors = useColors();
  if (prizes.length === 0) {
    return (
      <Text variant="small" tone="textMuted" style={styles.empty}>
        Novos prêmios chegam em breve.
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      {prizes.map((p) => {
        const missing = total === null ? p.points : Math.max(0, p.points - total);
        const can = total !== null && missing === 0;
        return (
          <View key={p.id} style={styles.prize}>
            <View style={styles.pImg}>
              {p.imageUrl ? (
                <Image source={p.imageUrl} style={styles.pImgFill} contentFit="cover" />
              ) : (
                <Icon name="gift" color={colors.textMuted} />
              )}
            </View>
            <View style={styles.pText}>
              <Text variant="bodyStrong" numberOfLines={2}>
                {p.name}
              </Text>
              <Text variant="caption" tone="textMuted">
                {PRIZE_KIND_LABEL[p.kind]} · restam {p.stock}
              </Text>
              <Text variant="smallStrong" tone="brandText">
                {formatPoints(p.points)}
              </Text>
            </View>
            {can ? (
              <Button label="Trocar" size="sm" variant="brand" onPress={() => openRedeemSheet(p)} />
            ) : total === null ? (
              <Button
                label="Trocar"
                size="sm"
                variant="soft"
                onPress={() =>
                  requireAuth(() => undefined, {
                    title: "Entre para trocar seus pontos",
                    text: "Crie sua conta, cumpra desafios e troque os pontos por prêmios.",
                  })
                }
              />
            ) : (
              <Pill label={`Faltam ${missing}`} variant="default" />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Ranking: só apelidos de quem aceitou. */
export function RankingCard({
  ranking,
  signedIn,
}: {
  ranking: Club["ranking"];
  signedIn: boolean;
}) {
  const styles = useStyles();
  const { top, me, joined } = ranking;
  const meOutside = me && !top.some((e) => e.position === me.position);
  return (
    <View style={styles.rank}>
      {top.length === 0 ? (
        <Text variant="small" tone="textMuted">
          Ninguém no ranking ainda. Seja o primeiro!
        </Text>
      ) : (
        top.map((e) => <RankRow key={e.position} {...e} mine={me?.position === e.position} />)
      )}
      {meOutside && me ? <RankRow {...me} mine /> : null}
      <View style={styles.rankBtn}>
        {joined ? (
          <Button
            label="Sair do ranking"
            size="sm"
            variant="soft"
            onPress={openLeaveRankingSheet}
          />
        ) : (
          <Button
            label="Entrar no ranking"
            size="sm"
            variant="dark"
            iconLeft="trophy"
            onPress={() =>
              signedIn
                ? openJoinRankingSheet()
                : requireAuth(openJoinRankingSheet, { title: "Entre para participar do ranking" })
            }
          />
        )}
      </View>
    </View>
  );
}

function RankRow({
  position,
  nickname,
  points,
  mine,
}: {
  position: number;
  nickname: string;
  points: number;
  mine: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.rankRow, mine && styles.rankMine]}>
      <Text variant="smallStrong" tabular style={styles.pos}>
        {position}º
      </Text>
      <Text variant="body" numberOfLines={1} style={styles.nick}>
        {nickname}
        {mine ? " (você)" : ""}
      </Text>
      <Text variant="smallStrong" tabular tone="brandText">
        {points.toLocaleString("pt-BR")}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingHorizontal: layout.gutter },
  seal: {
    backgroundColor: t.colors.surface,
    borderRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
    alignItems: "center",
    gap: 6,
  },
  empty: { marginHorizontal: layout.gutter },
  list: { gap: 10, paddingHorizontal: layout.gutter },
  prize: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
  },
  pImg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pImgFill: { width: "100%", height: "100%" },
  pText: { flex: 1, minWidth: 0, gap: 2 },
  rank: {
    marginHorizontal: layout.gutter,
    padding: 14,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    gap: 4,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  rankMine: { backgroundColor: t.colors.brand50 },
  pos: { width: 34 },
  nick: { flex: 1 },
  rankBtn: { marginTop: 8, alignItems: "flex-start" },
}));
