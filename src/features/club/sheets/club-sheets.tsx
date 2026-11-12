import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import {
  type ClubPrize,
  type ClubRedemption,
  type ClubSeal,
  joinRankingBodySchema,
} from "@/contracts/app/club";
import { PRIZE_KIND_LABEL } from "@/contracts/gamification";
import { appApi } from "@/core/api/app-api";
import { errorMessage } from "@/core/api/errors";
import {
  Button,
  createStyles,
  fontFamily,
  Icon,
  SealBadge,
  SheetActions,
  type SheetApi,
  SheetIcon,
  SheetText,
  SheetTitle,
  Skeleton,
  sheet,
  Text,
  toast,
  tracking,
  useColors,
} from "@/design";
import { CheckRow, requireAuth } from "@/features/auth";
import { AuthField } from "@/shared/form/AuthField";
import { refreshClub, useTrevoStatement } from "../api/club";
import { ConquestRow } from "../components/ConquestRow";
import {
  DEFAULT_PICKUP_RULES,
  entriesOfSeal,
  formatTrevos,
  fullDate,
  sealCountLabel,
} from "../lib/club";

/* Selo (categoria): histórico de conquistas ------------------------------- */

/** Abre o histórico de conquistas da categoria (selo). */
export function openSealHistorySheet(seal: ClubSeal, signedIn: boolean): void {
  sheet.open(() => <SealHistory seal={seal} signedIn={signedIn} />, { scrollable: true });
}

function SealHistory({ seal, signedIn }: { seal: ClubSeal; signedIn: boolean }) {
  const styles = useStyles();
  const statement = useTrevoStatement();
  const items = statement.data ? entriesOfSeal(statement.data.entries, seal.seal.id) : [];
  return (
    <>
      <View style={styles.center}>
        <SealBadge seal={seal.seal} size={84} locked={seal.times === 0} />
      </View>
      <SheetTitle>{seal.seal.name}</SheetTitle>
      <SheetText>
        {seal.times > 0
          ? `${sealCountLabel(seal.times)} conquistados. Cada conquista vale ${formatTrevos(seal.points)}${seal.repeatable ? " e dá para ganhar de novo" : ""}.`
          : `Você ainda não tem este selo. Cada conquista vale ${formatTrevos(seal.points)}.`}
      </SheetText>
      <View style={styles.history}>
        {!signedIn ? (
          <Text variant="small" tone="textMuted" align="center">
            Entre na sua conta para ver suas conquistas.
          </Text>
        ) : statement.isLoading ? (
          <>
            <Skeleton height={48} />
            <Skeleton height={48} />
          </>
        ) : items.length === 0 ? (
          <Text variant="small" tone="textMuted" align="center">
            Cumpra um desafio desta categoria e a conquista aparece aqui.
          </Text>
        ) : (
          items.map((e) => <ConquestRow key={e.id} title={e.title} at={e.at} points={e.points} />)
        )}
      </View>
    </>
  );
}

/* Prêmio: detalhe e troca ------------------------------------------------- */

/** Foto, descrição, como retirar e o botão de trocar (gera o código). `total` null = sem login. */
export function openPrizeSheet(prize: ClubPrize, total: number | null): void {
  sheet.open((api) => <PrizeDetail api={api} prize={prize} total={total} />, { scrollable: true });
}

function PrizeDetail({
  api,
  prize,
  total,
}: {
  api: SheetApi;
  prize: ClubPrize;
  total: number | null;
}) {
  const styles = useStyles();
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const missing = total === null ? prize.points : Math.max(0, prize.points - total);
  const can = total !== null && missing === 0;

  const redeem = async () => {
    setSaving(true);
    try {
      const r = await appApi.club.redeem(prize.id);
      refreshClub();
      api.close();
      toast.show("Troca feita! Mostre o código no Mercado Local", "circle-check");
      openRedemptionSheet(r);
    } catch (e) {
      toast.show(errorMessage(e), "circle-alert");
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.photo}>
        {prize.imageUrl ? (
          <Image source={prize.imageUrl} style={styles.fill} contentFit="cover" />
        ) : (
          <Icon name="gift" size={40} color={colors.textMuted} />
        )}
      </View>
      <Text variant="caption" tone="textMuted" align="center">
        {PRIZE_KIND_LABEL[prize.kind]} · restam {prize.stock}
      </Text>
      <SheetTitle>{prize.name}</SheetTitle>
      <Text variant="h2" tone="brandText" align="center">
        {formatTrevos(prize.points)}
      </Text>
      {prize.description ? <SheetText>{prize.description}</SheetText> : null}
      <View style={styles.rules}>
        <View style={styles.rulesHead}>
          <Icon name="map-pin" size={16} color={colors.brandText} />
          <Text variant="smallStrong">Como retirar</Text>
        </View>
        <Text variant="small" tone="textSecondary">
          {prize.pickupRules || DEFAULT_PICKUP_RULES}
        </Text>
      </View>
      <SheetActions>
        {total === null ? (
          <Button
            label="Entrar para trocar"
            variant="brand"
            onPress={api.closeThen(() =>
              requireAuth(() => undefined, { title: "Entre para trocar seus Trevos" }),
            )}
          />
        ) : !can ? (
          <Button label={`Faltam ${formatTrevos(missing)}`} variant="soft" disabled />
        ) : confirming ? (
          <>
            <Text variant="small" tone="textMuted" align="center">
              {formatTrevos(prize.points)} saem do seu saldo agora. Se não retirar em 7 dias, eles
              voltam.
            </Text>
            <Button
              label="Confirmar troca"
              variant="brand"
              iconLeft="check"
              loading={saving}
              onPress={() => void redeem()}
            />
            <Button label="Voltar" variant="soft" onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button
            label={`Trocar por ${formatTrevos(prize.points)}`}
            variant="brand"
            iconLeft="gift"
            onPress={() => setConfirming(true)}
          />
        )}
      </SheetActions>
    </>
  );
}

/* Código da troca ---------------------------------------------------------- */

/** O código para mostrar no Mercado Local (e desistir da troca). */
export function openRedemptionSheet(r: ClubRedemption): void {
  sheet.open((api) => <RedemptionCode api={api} r={r} />);
}

function RedemptionCode({ api, r }: { api: SheetApi; r: ClubRedemption }) {
  const styles = useStyles();
  const [cancelling, setCancelling] = useState(false);
  const cancel = async () => {
    setCancelling(true);
    try {
      await appApi.club.cancelRedemption(r.id);
      refreshClub();
      api.close();
      toast.show(`Troca cancelada: ${formatTrevos(r.points)} voltaram`, "circle-check");
    } catch (e) {
      toast.show(errorMessage(e), "circle-alert");
    } finally {
      setCancelling(false);
    }
  };
  return (
    <>
      <SheetIcon name="ticket-check" background="brand" />
      <SheetTitle>{r.prize.name}</SheetTitle>
      <SheetText>
        Mostre este código no Mercado Local
        {r.expiresAt ? ` até ${fullDate(r.expiresAt)}` : ""}. A equipe confere e entrega o prêmio.
      </SheetText>
      <View
        style={styles.codeBox}
        accessible
        accessibilityLabel={`Código ${r.code.split("").join(" ")}`}
      >
        <Text style={styles.code} selectable>
          {r.code}
        </Text>
      </View>
      <SheetActions>
        <Button label="Ok" variant="dark" onPress={api.close} />
        <Button
          label="Desistir da troca"
          variant="soft"
          loading={cancelling}
          onPress={() =>
            sheet.message({
              icon: "rotate-ccw",
              title: "Desistir da troca?",
              text: `${formatTrevos(r.points)} voltam para o seu saldo e o prêmio volta para a lojinha.`,
              actions: [
                { label: "Desistir", onPress: () => void cancel() },
                { label: "Manter troca", onPress: () => openRedemptionSheet(r) },
              ],
            })
          }
        />
      </SheetActions>
    </>
  );
}

/* Ranking ----------------------------------------------------------------- */

/** Entrar no ranking: apelido (o nome real nunca aparece) e aceite. */
export function openJoinRankingSheet(): void {
  sheet.open((api) => <JoinRanking api={api} />);
}

function JoinRanking({ api }: { api: SheetApi }) {
  const styles = useStyles();
  const [nickname, setNickname] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<{ nickname?: string; accept?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const parsed = joinRankingBodySchema.safeParse({ nickname, accept });
    if (!parsed.success) {
      const issues = parsed.error.issues;
      setError({
        nickname: issues.find((i) => i.path[0] === "nickname")?.message,
        accept: issues.find((i) => i.path[0] === "accept")?.message,
      });
      return;
    }
    setSaving(true);
    try {
      await appApi.club.joinRanking(parsed.data);
      refreshClub();
      api.close();
      toast.show("Você entrou no ranking");
    } catch (e) {
      setError({ nickname: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SheetIcon name="trophy" background="brand" />
      <SheetTitle>Entrar no ranking</SheetTitle>
      <SheetText>
        No ranking aparece só o seu apelido e os seus Trevos. Seu nome nunca aparece.
      </SheetText>
      <View style={styles.form}>
        <AuthField
          icon="user"
          label="Apelido"
          value={nickname}
          onChangeText={(v) => {
            setNickname(v);
            setError((e) => ({ ...e, nickname: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          error={error.nickname}
          hint="3 a 20 letras ou números"
        />
        <CheckRow
          checked={accept}
          onChange={(v) => {
            setAccept(v);
            setError((e) => ({ ...e, accept: undefined }));
          }}
          label="Aceito aparecer no ranking com este apelido"
          error={error.accept}
        />
      </View>
      <SheetActions>
        <Button label="Entrar no ranking" variant="brand" loading={saving} onPress={submit} />
        <Button
          label="Ver regulamento"
          variant="soft"
          onPress={api.closeThen(() =>
            router.push({ pathname: "/texto/[key]", params: { key: "club_rules" } }),
          )}
        />
      </SheetActions>
    </>
  );
}

/** Sair do ranking (confirmação). */
export function openLeaveRankingSheet(): void {
  sheet.message({
    icon: "log-out",
    title: "Sair do ranking?",
    text: "Seu apelido deixa de aparecer. Seus Trevos continuam valendo.",
    actions: [
      {
        label: "Sair do ranking",
        onPress: () =>
          void appApi.club
            .leaveRanking()
            .then(() => {
              refreshClub();
              toast.show("Você saiu do ranking");
            })
            .catch((e: unknown) => toast.show(errorMessage(e), "circle-alert")),
      },
      { label: "Ficar" },
    ],
  });
}

const useStyles = createStyles((t) => ({
  form: { alignSelf: "stretch", gap: 12, marginTop: 4, marginBottom: 8 },
  center: { alignItems: "center", marginBottom: 8 },
  history: { alignSelf: "stretch", gap: 8, marginTop: 8, marginBottom: 8 },
  photo: {
    alignSelf: "stretch",
    height: 200,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  fill: { width: "100%", height: "100%" },
  rules: {
    alignSelf: "stretch",
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: t.colors.surface,
    marginTop: 8,
    marginBottom: 8,
  },
  rulesHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  codeBox: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: t.colors.brand50,
    marginVertical: 8,
  },
  code: {
    fontFamily: fontFamily(900),
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: tracking(38, 0.18),
    color: t.colors.text,
  },
}));
