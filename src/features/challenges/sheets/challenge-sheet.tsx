import { router } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { ChallengeItem } from "@/contracts/app/challenges";
import { useSession } from "@/core/auth/session";
import {
  Button,
  createStyles,
  Icon,
  Pill,
  SealBadge,
  SheetActions,
  type SheetApi,
  SheetText,
  SheetTitle,
  sheet,
  Text,
  useColors,
} from "@/design";
import { useChallenges } from "../api/challenges";
import { formatEndDay } from "../lib/progress";

/** Painel do desafio (ACTIONS.challenge do protótipo). Público: a home e a loja também abrem. */
export function openChallengeSheet(challenge: ChallengeItem): void {
  sheet.open((api) => <ChallengeSheet challenge={challenge} api={api} />);
}

function ChallengeSheet({ challenge: initial, api }: { challenge: ChallengeItem; api: SheetApi }) {
  const colors = useColors();
  const styles = useStyles();
  const status = useSession((s) => s.status);
  const { data } = useChallenges();
  // versão do cache, se houver: reflete um selo ganho enquanto o painel está aberto
  const challenge = data?.challenges.find((c) => c.id === initial.id) ?? initial;
  const campaign = data?.campaign ?? null;
  const signedIn = status === "signedIn";
  const done = signedIn && challenge.earned;
  const { seal, store, event } = challenge;

  const how = challenge.howTo.trim().replace(/[.!]+$/, "");
  const until = campaign
    ? `Vale até ${formatEndDay(campaign.endsAt)}, enquanto o desafio estiver ativo.`
    : "Vale enquanto o desafio estiver ativo.";

  let main: ReactNode;
  if (!signedIn) {
    main = (
      <Button
        label="Criar conta para participar"
        onPress={api.closeThen(() => router.push("/cadastro"))}
      />
    );
  } else if (done) {
    main = <Button label="Selo já conquistado" variant="soft" iconLeft="check" disabled />;
  } else if (challenge.validation === "qr") {
    main = (
      <Button
        label="Ler QR Code"
        variant="brand"
        iconLeft="scan-line"
        onPress={api.closeThen(() =>
          router.push({ pathname: "/ler-qr", params: { desafio: challenge.id } }),
        )}
      />
    );
  } else {
    main = (
      <View style={styles.auto} accessible>
        <View style={styles.autoIc}>
          <Icon name="zap" size={18} color={colors.onBrand} />
        </View>
        <View style={styles.autoText}>
          <Text variant="smallStrong">Validação automática</Text>
          <Text variant="small" tone="textMuted">
            Este selo entra sozinho na sua coleção quando o desafio for cumprido. Não precisa ler QR
            Code.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.head}>
        <SealBadge seal={seal} size={72} locked={!done} />
        <Pill
          label={done ? "Conquistado" : `Selo ${seal.name}`}
          variant={done ? "brand" : "default"}
          icon={done ? "check" : undefined}
        />
      </View>
      <SheetTitle>{challenge.title}</SheetTitle>
      <SheetText>
        {how}. {until} Cada pessoa ganha o selo uma vez.
      </SheetText>
      <SheetActions>
        {main}
        {store ? (
          <Button
            label={`Ver ${store.name}`}
            variant="soft"
            iconLeft="store"
            onPress={api.closeThen(() => router.push(`/loja/${store.slug}`))}
          />
        ) : null}
        {event ? (
          <Button
            label="Ver evento"
            variant="soft"
            iconLeft="calendar-days"
            onPress={api.closeThen(() =>
              router.push({ pathname: "/evento/[id]", params: { id: event.id } }),
            )}
          />
        ) : null}
      </SheetActions>
    </>
  );
}

const useStyles = createStyles((t) => ({
  head: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  auto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: t.colors.brand50,
  },
  autoIc: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  autoText: { flex: 1, gap: 2 },
}));
