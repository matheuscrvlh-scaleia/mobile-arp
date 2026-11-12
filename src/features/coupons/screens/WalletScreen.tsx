import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { Claim, WalletTab } from "@/contracts/app/coupons";
import { useSession } from "@/core/auth/session";
import {
  BottomSpacer,
  createStyles,
  EmptyState,
  Icon,
  IconButton,
  layout,
  motion,
  NavHeader,
  PressableScale,
  radii,
  ScreenContainer,
  Segmented,
  Skeleton,
  Spinner,
  Text,
  useColors,
  withAlpha,
} from "@/design";
import { PendingRedemptions, sealsSummary, TrevoBalanceCard, useClub } from "@/features/club";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useWallet } from "../api/coupons";
import { WalletItem } from "../components/WalletItem";
import { effectiveStatus } from "../lib/claim-status";

/**
 * Minha carteira: o lugar dos benefícios. Saldo de Trevos (com o extrato),
 * prêmios para retirar, cupons (ativos, usados, expirados) e conquistas.
 */
export default function WalletScreen() {
  const status = useSession((s) => s.status);
  if (status === "guest") return <GuestWallet />;
  return <SignedInWallet restoring={status === "restoring"} />;
}

function GuestWallet() {
  const router = useRouter();
  const styles = useStyles();
  return (
    <ScreenContainer top="none" scroll>
      <NavHeader title="Minha carteira" />
      <View style={styles.headTop}>
        <TrevoBalanceCard
          total={null}
          validUntil={null}
          onStatement={() => undefined}
          onSignIn={() => router.push("/entrar")}
        />
      </View>
      <EmptyState
        icon="wallet"
        title="Sua carteira aparece aqui"
        text="Crie sua conta para pegar cupons, ganhar Trevos e trocar por prêmios."
        action={{ label: "Criar conta", onPress: () => router.push("/cadastro") }}
        style={styles.guest}
      />
    </ScreenContainer>
  );
}

function SignedInWallet({ restoring }: { restoring: boolean }) {
  const router = useRouter();
  const styles = useStyles();
  const colors = useColors();
  const [tab, setTab] = useState<WalletTab>("active");
  const query = useWallet(tab);
  const club = useClub();
  // toda aba devolve os contadores; os da aba "ativos" seguram o número enquanto a outra carrega
  const active = useWallet("active");
  const claims = query.data?.pages.flatMap((p) => p.data) ?? [];
  const counts = query.data?.pages[0]?.counts ?? active.data?.pages[0]?.counts;
  const refreshControl = useRefreshControl(async () => {
    await Promise.all([query.refetch(), club.refetch()]);
  });
  // "agora" da lista: avança quando um contador zera (vencido offline sai de "ativo")
  const [now, setNow] = useState(() => Date.now());
  const onExpire = () => {
    setNow(Date.now());
    void query.refetch();
  };
  const points = club.data?.points ?? null;
  const pending = club.data?.pendingRedemptions ?? [];
  const seals = sealsSummary(club.data?.seals ?? []);
  const openStatement = () => router.push("/carteira/trevos");

  const view = restoring ? "loading" : queryView(query);
  let empty: ReactElement;
  if (view !== "ready") {
    empty = (
      <QueryFallback
        view={view}
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        skeleton={
          <View style={styles.skeletons}>
            <Skeleton height={102} radius={radii.xl} />
            <Skeleton height={102} radius={radii.xl} />
          </View>
        }
      />
    );
  } else {
    empty = (
      <EmptyState
        compact
        icon="ticket"
        title="Nada por aqui"
        text={
          tab === "active" ? "Pegue um cupom e ele aparece aqui." : "Seu histórico aparece aqui."
        }
      />
    );
  }

  const header = (
    <View>
      <View style={styles.headTop}>
        <TrevoBalanceCard
          total={points?.total ?? 0}
          validUntil={points?.validUntil ?? null}
          onStatement={openStatement}
        />
      </View>
      {pending.length > 0 ? (
        <>
          <SectionTitle title="Prêmios para retirar" />
          <PendingRedemptions items={pending} />
        </>
      ) : null}
      <SectionTitle
        title="Meus cupons"
        action={{ label: "Pegar cupons", onPress: () => openPath("/cupons") }}
      />
      <View style={styles.segment}>
        <Segmented<WalletTab>
          options={[
            { value: "active", label: "Ativos", count: counts?.active },
            { value: "used", label: "Usados" },
            { value: "expired", label: "Expirados" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "expired" ? (
          <View style={styles.notice}>
            <Icon name="info" size={18} color={colors.dangerText} />
            <Text variant="small" tone="dangerText" style={styles.noticeText}>
              Quando o prazo acaba sem uso, o cupom volta para a promoção e outra pessoa pode pegar.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const footer = (
    <>
      {query.isFetchingNextPage ? (
        <View style={styles.more}>
          <Spinner color={colors.textMuted} />
        </View>
      ) : null}
      <SectionTitle
        title="Minhas conquistas"
        action={{ label: "Ver no Clube", onPress: () => openPath("/desafios") }}
      />
      <PressableScale
        scaleTo={motion.pressScale.card}
        onPress={() => openPath("/desafios")}
        accessibilityRole="button"
        accessibilityLabel={`${seals.total} selos conquistados. Abrir o Clube ARP`}
        style={styles.conquests}
      >
        <View style={styles.conquestIcon}>
          <Icon name="award" size={20} color={colors.brandText} />
        </View>
        <View style={styles.conquestText}>
          <Text variant="bodyStrong">
            {seals.total} {seals.total === 1 ? "selo conquistado" : "selos conquistados"}
          </Text>
          <Text variant="caption" tone="textMuted">
            {seals.last ? `Último: ${seals.last}` : "Cumpra desafios para ganhar selos"}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.textMuted} />
      </PressableScale>
      <BottomSpacer kind="safe" />
    </>
  );

  return (
    <ScreenContainer top="none">
      <NavHeader
        title="Minha carteira"
        right={
          <IconButton
            icon="receipt-text"
            accessibilityLabel="Extrato de Trevos"
            onPress={openStatement}
          />
        }
      />
      <FlashList<Claim>
        data={claims}
        keyExtractor={(c) => c.id}
        extraData={now}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <WalletItem claim={item} status={effectiveStatus(item, now)} onExpire={onExpire} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </ScreenContainer>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  return (
    <View style={styles.secH}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Text
          variant="smallStrong"
          tone="brandText"
          accessibilityRole="link"
          onPress={action.onPress}
          style={styles.secAction}
        >
          {action.label}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  guest: { marginTop: 32 },
  headTop: { marginTop: 12 },
  secH: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: layout.sectionTop,
    marginBottom: layout.sectionBottom,
    marginHorizontal: layout.gutter,
  },
  secAction: { paddingVertical: 8, paddingLeft: 12 },
  segment: { paddingHorizontal: layout.gutter, paddingBottom: 16 },
  notice: {
    marginTop: 14,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: withAlpha(t.colors.dangerSoft, 0.6),
    flexDirection: "row",
    gap: 10,
  },
  noticeText: { flex: 1, lineHeight: 19 },
  item: { paddingHorizontal: layout.gutter, paddingBottom: 12 },
  skeletons: { paddingHorizontal: layout.gutter, gap: 12 },
  more: { paddingVertical: 16, alignItems: "center" },
  conquests: {
    marginHorizontal: layout.gutter,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: t.colors.surface,
  },
  conquestIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: t.colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  conquestText: { flex: 1, minWidth: 0, gap: 2 },
}));
