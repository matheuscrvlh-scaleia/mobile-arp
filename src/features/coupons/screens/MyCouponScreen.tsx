import { useQueryClient } from "@tanstack/react-query";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import type { WalletStatus } from "@/contracts/app/coupons";
import { useSession } from "@/core/auth/session";
import { cancelReminder } from "@/core/notifications/reminders";
import { queryKeys } from "@/core/query/keys";
import {
  BottomSpacer,
  Button,
  createStyles,
  EmptyState,
  NavHeader,
  Pill,
  RadialGlow,
  radii,
  ScreenContainer,
  Skeleton,
  toast,
  useColors,
} from "@/design";
import { storeLocation, useStore } from "@/features/stores";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { haptic } from "@/shared/lib/haptics";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { isClaimNotFound, useClaim } from "../api/coupons";
import { TICKET_SCREEN_BG, Ticket } from "../components/Ticket";
import { TicketHeaderActions } from "../components/TicketHeaderActions";
import { TicketSnapshot } from "../components/TicketSnapshot";
import { useSaveTicketImage } from "../hooks/useSaveTicketImage";
import { WALLET_TABS } from "../lib/claim-cache";
import { effectiveStatus } from "../lib/claim-status";
import { validDaysLabel, validToday } from "../lib/weekdays";

const GLOW_CENTER = { x: 0.85, y: -0.15 };

export default function MyCouponScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const styles = useStyles();
  const colors = useColors();
  const qc = useQueryClient();
  const focused = useIsFocused();
  const sessionStatus = useSession((s) => s.status);
  const signedIn = sessionStatus === "signedIn";
  // Só acompanha a validação com a tela à vista (o hook ainda exige o pego ativo).
  const query = useClaim(id, { poll: focused });
  // 404 (não é desta conta) vale mais que o cache.
  const notFound = signedIn && isClaimNotFound(query.error);
  // O cache não sabe de quem é a conta: sem sessão, nada do pego aparece.
  const claim = signedIn && !notFound ? query.data : undefined;
  const store = useStore(claim?.store.slug);
  const refreshControl = useRefreshControl(query.refetch);
  // Desestruturado: ler `snapshotRef`/`onSnapshotReady` de um objeto no JSX conta, para o
  // React Compiler, como acessar ref durante o render.
  const { snapshotRef, snapshotVisible, save, share, onSnapshotReady } = useSaveTicketImage(claim);

  // Prazo zerado na tela: mostra vencido mesmo sem rede (a API diria o mesmo).
  const [mountedAt] = useState(() => Date.now());
  const [ended, setEnded] = useState(false);
  const status: WalletStatus | undefined = claim
    ? effectiveStatus(claim, ended ? Number.POSITIVE_INFINITY : mountedAt)
    : undefined;

  // A loja validou (ou o prazo venceu) enquanto a tela estava aberta.
  const previous = useRef(status);
  useEffect(() => {
    const before = previous.current;
    previous.current = status;
    if (!status || before !== "active" || status === "active") return;
    void cancelReminder(`claim:${id}`);
    for (const tab of WALLET_TABS) {
      void qc.invalidateQueries({ queryKey: queryKeys.me.wallet(tab), exact: true });
    }
    void qc.invalidateQueries({ queryKey: queryKeys.me.profile() });
    // estoque público: só marca como velho (o ERP ainda devolveria o valor anterior)
    void qc.invalidateQueries({ queryKey: queryKeys.couponsAll(), refetchType: "none" });
    if (status === "used") {
      haptic.success();
      toast.show("A loja validou seu cupom. Aproveite!", "circle-check", { haptic: "none" });
    }
  }, [status, id, qc]);

  const active = !!claim && status === "active";

  const onExpire = () => {
    setEnded(true);
    void query.refetch();
  };

  let body: ReactNode;
  if (sessionStatus === "guest") {
    body = (
      <EmptyState
        icon="wallet"
        title="Entre para ver seu cupom"
        text="Os cupons ficam na carteira da sua conta."
        action={{ label: "Entrar", onPress: () => router.push("/entrar") }}
        style={styles.card}
      />
    );
  } else if (notFound) {
    body = (
      <EmptyState
        icon="ticket"
        title="Cupom não encontrado"
        text="Ele não está na sua carteira."
        action={{ label: "Ver minha carteira", onPress: () => router.replace("/carteira") }}
        style={styles.card}
      />
    );
  } else if (claim && status) {
    body = (
      <>
        <Ticket claim={claim} status={status} store={store.data} onExpire={onExpire} />
        {status !== "active" ? (
          <View style={styles.foot}>
            <Button
              label="Ver outros cupons"
              iconRight="arrow-right"
              onPress={() => openPath("/cupons")}
            />
          </View>
        ) : null}
      </>
    );
  } else {
    // restaurando a sessão conta como "carregando"
    const view = signedIn ? queryView(query) : "loading";
    body =
      view === "ready" ? null : (
        <View style={view === "loading" ? styles.skeleton : styles.card}>
          <QueryFallback
            view={view}
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            skeleton={<Skeleton height={520} radius={30} color={colors.surfaceRaised} />}
          />
        </View>
      );
  }

  return (
    // fundo verde nos dois temas: ícones escuros da status bar (como o `onBrand`)
    <ScreenContainer top="none" background={colors[TICKET_SCREEN_BG]} statusBar="dark">
      {/* radial-gradient(260px 220px at 85% -40px, brand300, transparent) */}
      <View style={styles.glow}>
        <RadialGlow color={colors.brand300} center={GLOW_CENTER} radius={0.6} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <NavHeader
          title="Meu cupom"
          titleColor={colors.onBrand}
          backVariant="white"
          right={active ? <TicketHeaderActions onShare={share} onSave={save} /> : undefined}
        />
        {active && claim && !validToday(claim.coupon.weekdays) ? (
          <View style={styles.notToday}>
            <Pill
              label={`Hoje não é dia de usar. ${validDaysLabel(claim.coupon.weekdays)}.`}
              icon="circle-alert"
              variant="clay"
            />
          </View>
        ) : null}
        {body}
        <BottomSpacer kind="safe" extra={16} />
      </ScrollView>
      {active && snapshotVisible ? (
        <TicketSnapshot
          ref={snapshotRef}
          claim={claim}
          location={store.data ? storeLocation(store.data) : undefined}
          onReady={onSnapshotReady}
        />
      ) : null}
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 280, pointerEvents: "none" },
  foot: { marginTop: 18, paddingHorizontal: 20 },
  card: {
    marginTop: 18,
    marginHorizontal: 20,
    backgroundColor: t.colors.surfaceRaised,
    borderRadius: radii.cardLg,
  },
  skeleton: { marginTop: 18, marginHorizontal: 20 },
  notToday: { marginTop: 12, marginHorizontal: 20, alignItems: "flex-start" },
}));
