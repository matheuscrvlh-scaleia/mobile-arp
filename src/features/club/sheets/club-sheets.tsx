import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import type { ClubPrize } from "@/contracts/app/club";
import { joinRankingBodySchema } from "@/contracts/app/club";
import { appApi } from "@/core/api/app-api";
import { errorMessage, isApiError } from "@/core/api/errors";
import { queryKeys } from "@/core/query/keys";
import { queryClient } from "@/core/query/query-client";
import {
  Button,
  createStyles,
  SheetActions,
  type SheetApi,
  SheetIcon,
  SheetText,
  SheetTitle,
  sheet,
  toast,
} from "@/design";
import { CheckRow } from "@/features/auth";
import { AuthField } from "@/shared/form/AuthField";
import { formatPoints } from "../lib/club";

function refreshClub() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.club() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.home(), refetchType: "none" });
  void queryClient.invalidateQueries({ queryKey: queryKeys.me.profile() });
}

/** Confirma a troca e mostra o código de retirada. */
export function openRedeemSheet(prize: ClubPrize): void {
  sheet.message({
    icon: "gift",
    title: `Trocar por ${prize.name}?`,
    text: `Saem ${formatPoints(prize.points)} do seu total. Você retira no Centro de Informações com o código.`,
    actions: [
      { label: "Trocar", variant: "brand", onPress: () => void redeem(prize) },
      { label: "Agora não" },
    ],
  });
}

async function redeem(prize: ClubPrize): Promise<void> {
  try {
    const result = await appApi.club.redeem(prize.id);
    refreshClub();
    sheet.message({
      icon: "circle-check",
      title: `Código ${result.code}`,
      text: `Mostre este código no Centro de Informações para retirar ${result.prize.name}. Você ainda tem ${formatPoints(result.totalPoints)}.`,
      actions: [{ label: "Entendi" }],
      dismissible: false,
    });
  } catch (e) {
    if (isApiError(e)) refreshClub();
    toast.show(errorMessage(e), "circle-alert");
  }
}

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
        No ranking aparece só o seu apelido e os seus pontos. Seu nome nunca aparece.
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
    text: "Seu apelido deixa de aparecer. Seus pontos continuam valendo.",
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

const useStyles = createStyles(() => ({
  form: { alignSelf: "stretch", gap: 12, marginTop: 4, marginBottom: 8 },
}));
