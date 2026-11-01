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
  NavHeader,
  radii,
  ScreenContainer,
  Segmented,
  Skeleton,
  Spinner,
  Text,
  useColors,
  withAlpha,
} from "@/design";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useWallet } from "../api/coupons";
import { WalletItem } from "../components/WalletItem";
import { effectiveStatus } from "../lib/claim-status";

export default function WalletScreen() {
  const status = useSession((s) => s.status);
  if (status === "guest") return <GuestWallet />;
  return <SignedInWallet restoring={status === "restoring"} />;
}

function GuestWallet() {
  const router = useRouter();
  const styles = useStyles();
  return (
    <ScreenContainer top="none">
      <NavHeader title="Meus cupons" />
      <EmptyState
        icon="wallet"
        title="Sua carteira aparece aqui"
        text="Crie sua conta para pegar cupons."
        action={{ label: "Criar conta", onPress: () => router.push("/cadastro") }}
        style={styles.guest}
      />
    </ScreenContainer>
  );
}

function SignedInWallet({ restoring }: { restoring: boolean }) {
  const styles = useStyles();
  const colors = useColors();
  const [tab, setTab] = useState<WalletTab>("active");
  const query = useWallet(tab);
  // toda aba devolve os contadores; os da aba "ativos" seguram o número enquanto a outra carrega
  const active = useWallet("active");
  const claims = query.data?.pages.flatMap((p) => p.data) ?? [];
  const counts = query.data?.pages[0]?.counts ?? active.data?.pages[0]?.counts;
  const refreshControl = useRefreshControl(query.refetch);
  // "agora" da lista: avança quando um contador zera (vencido offline sai de "ativo")
  const [now, setNow] = useState(() => Date.now());
  const onExpire = () => {
    setNow(Date.now());
    void query.refetch();
  };

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
            <Skeleton height={102} radius={radii.xl} />
          </View>
        }
      />
    );
  } else {
    empty = (
      <EmptyState
        icon="ticket"
        title="Nada por aqui"
        text={
          tab === "active" ? "Pegue um cupom e ele aparece aqui." : "Seu histórico aparece aqui."
        }
      />
    );
  }

  return (
    <ScreenContainer top="none">
      <NavHeader
        title="Meus cupons"
        right={
          <IconButton
            icon="plus"
            accessibilityLabel="Pegar mais cupons"
            onPress={() => openPath("/cupons")}
          />
        }
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
      <FlashList<Claim>
        data={claims}
        keyExtractor={(c) => c.id}
        extraData={now}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <WalletItem claim={item} status={effectiveStatus(item, now)} onExpire={onExpire} />
          </View>
        )}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <>
            {query.isFetchingNextPage ? (
              <View style={styles.more}>
                <Spinner color={colors.textMuted} />
              </View>
            ) : null}
            <BottomSpacer kind="safe" />
          </>
        }
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

const useStyles = createStyles((t) => ({
  guest: { marginTop: 80 },
  segment: { paddingHorizontal: layout.gutter, paddingTop: 18, paddingBottom: 16 },
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
}));
