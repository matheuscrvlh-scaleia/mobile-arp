import { Image } from "expo-image";
import { useWindowDimensions, View } from "react-native";
import type { Club, ClubPrize, ClubRedemption, ClubSeal } from "@/contracts/app/club";
import { PRIZE_KIND_LABEL } from "@/contracts/gamification";
import {
  Button,
  createStyles,
  fontFamily,
  Icon,
  layout,
  motion,
  Pill,
  PressableScale,
  SealBadge,
  Text,
  tracking,
  useColors,
} from "@/design";
import { requireAuth } from "@/features/auth";
import { dayMonth, formatTrevos, sealCountLabel } from "../lib/club";
import {
  openJoinRankingSheet,
  openLeaveRankingSheet,
  openPrizeSheet,
  openRedemptionSheet,
  openSealHistorySheet,
} from "../sheets/club-sheets";

const COLS = 3;
const GAP = 10;

/**
 * Selos como categorias colecionáveis (Fio Cultural, Transforma, Sabores…):
 * quantas conquistas em cada uma. Tocar abre o histórico da categoria.
 */
export function ClubSealGrid({
  seals,
  signedIn,
}: {
  seals: readonly ClubSeal[];
  signedIn: boolean;
}) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - layout.gutter * 2 - GAP * (COLS - 1)) / COLS);
  return (
    <View style={styles.grid}>
      {seals.map((s) => {
        const earned = s.times > 0;
        const count = sealCountLabel(s.times);
        // Mês sem desafio nesta categoria: aparece apagada (as conquistas continuam lá).
        // === false: API antiga sem o campo não apaga tudo.
        const off = s.hasChallenge === false;
        return (
          <PressableScale
            key={s.seal.id}
            scaleTo={motion.pressScale.card}
            onPress={() => openSealHistorySheet(s, signedIn)}
            style={[styles.seal, { width: cell }, off && styles.sealOff]}
            accessibilityRole="button"
            accessibilityLabel={`Selo ${s.seal.name}, ${count}${off ? ", sem desafio este mês" : ""}. Ver conquistas`}
          >
            <SealBadge seal={s.seal} size={60} locked={!earned} />
            <Text
              variant="smallStrong"
              weight={650}
              align="center"
              numberOfLines={2}
              tone={earned ? "text" : "textMuted"}
            >
              {s.seal.name}
            </Text>
            <View style={[styles.count, earned && styles.countOn]}>
              <Text variant="caption" weight={700} tone={earned ? "brandText" : "textMuted"}>
                {count}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Trocas feitas no app esperando retirada no Mercado Local (com o código). */
export function PendingRedemptions({ items }: { items: readonly ClubRedemption[] }) {
  const styles = useStyles();
  const colors = useColors();
  if (items.length === 0) return null;
  return (
    <View style={styles.list}>
      {items.map((r) => (
        <PressableScale
          key={r.id}
          scaleTo={motion.pressScale.card}
          onPress={() => openRedemptionSheet(r)}
          style={styles.pending}
          accessibilityRole="button"
          accessibilityLabel={`${r.prize.name}: código ${r.code.split("").join(" ")}. Mostre no Mercado Local`}
        >
          <View style={styles.pendingIcon}>
            <Icon name="ticket-check" color={colors.onBrand} />
          </View>
          <View style={styles.pText}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {r.prize.name}
            </Text>
            <Text variant="caption" tone="textMuted">
              Retire no Mercado Local{r.expiresAt ? ` até ${dayMonth(r.expiresAt)}` : ""}
            </Text>
          </View>
          <Text style={styles.code} tabular>
            {r.code}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

/**
 * Lojinha: tocar no prêmio abre foto, descrição e como retirar, com o botão
 * de trocar (gera o código para o Mercado Local).
 */
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
      <View style={styles.how}>
        <Icon name="info" size={18} color={colors.brandText} />
        <Text variant="small" tone="textMuted" style={styles.howText}>
          Troque aqui no app: você recebe um código e retira o prêmio no Mercado Local.
        </Text>
      </View>
      {prizes.map((p) => {
        const missing = total === null ? p.points : Math.max(0, p.points - total);
        const can = total !== null && missing === 0;
        return (
          <PressableScale
            key={p.id}
            scaleTo={motion.pressScale.card}
            onPress={() => openPrizeSheet(p, total)}
            style={styles.prize}
            accessibilityRole="button"
            accessibilityLabel={`${p.name}, ${formatTrevos(p.points)}. ${can ? "Dá para trocar" : "Ver detalhes"}`}
          >
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
                {formatTrevos(p.points)}
              </Text>
            </View>
            {can ? (
              <Pill label="Trocar" variant="brand" />
            ) : total === null ? (
              <Icon name="chevron-right" size={18} color={colors.textMuted} />
            ) : (
              <Pill label={`Faltam ${missing}`} variant="default" />
            )}
          </PressableScale>
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
      <Text
        variant="smallStrong"
        tabular
        tone="brandText"
        accessibilityLabel={formatTrevos(points)}
      >
        {points.toLocaleString("pt-BR")}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingHorizontal: layout.gutter },
  sealOff: { opacity: 0.4 },
  seal: {
    backgroundColor: t.colors.surface,
    borderRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
    alignItems: "center",
    gap: 6,
  },
  count: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: t.colors.surfaceRaised,
  },
  countOn: { backgroundColor: t.colors.brand50 },
  empty: { marginHorizontal: layout.gutter },
  how: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingHorizontal: 4 },
  howText: { flex: 1 },
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
  pending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 24,
    backgroundColor: t.colors.brand50,
  },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  code: {
    fontFamily: fontFamily(800),
    fontSize: 17,
    letterSpacing: tracking(17, 0.12),
    color: t.colors.text,
  },
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
