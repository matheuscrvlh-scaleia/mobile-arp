import { Redirect, useIsFocused, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import type { MerchantPeriod, MerchantStore } from "@/contracts/app/merchant";
import type { AuthUser } from "@/contracts/auth";
import { merchantSession, useMerchantSession } from "@/core/merchant/merchant-session";
import { BottomSpacer, createStyles, ScreenContainer, Spinner, type TabItem, Tabs } from "@/design";
import { goBackOr } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { haptic } from "@/shared/lib/haptics";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useMerchantOverview } from "../api/merchant";
import { HourChart } from "../components/HourChart";
import { LastUses } from "../components/LastUses";
import { CouponCarousel, NoCouponHero } from "../components/LiveHero";
import { MerchantHeader } from "../components/MerchantHeader";
import { OverviewSkeleton } from "../components/OverviewSkeleton";
import { StockPanel } from "../components/StockPanel";
import { StorePicker } from "../components/StorePicker";
import { ValidatePanel } from "../components/ValidatePanel";
import { openMerchantMenu } from "../sheets/merchant-sheets";

const PERIODS: readonly TabItem<MerchantPeriod>[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

/**
 * /lojista: porta de entrada da área do lojista. Sem sessão → entrar; senha provisória →
 * trocar; administração sem loja escolhida → seletor; senão, o painel da loja.
 */
export default function MerchantHomeScreen() {
  const status = useMerchantSession((s) => s.status);
  const profile = useMerchantSession((s) => s.profile);
  const [picking, setPicking] = useState(false);

  if (status === "restoring") {
    return (
      <ScreenContainer contentContainerStyle={base.centered}>
        <Spinner />
      </ScreenContainer>
    );
  }
  if (status === "signedOut" || !profile) return <Redirect href="/lojista/entrar" />;
  if (profile.user.mustChangePassword) return <Redirect href="/lojista/senha" />;

  const store = profile.stores.find((s) => s.id === profile.storeId) ?? null;
  const canSwitch = profile.allStores && profile.stores.length > 1;

  if (!store || picking) {
    return (
      <StorePicker
        stores={profile.stores}
        selectedId={profile.storeId}
        onSelect={(next) => {
          haptic.select();
          merchantSession.selectStore(next.id);
          setPicking(false);
        }}
        onBack={() => (store ? setPicking(false) : goBackOr("/perfil"))}
      />
    );
  }

  return (
    <Dashboard
      store={store}
      user={profile.user}
      onSwitchStore={canSwitch ? () => setPicking(true) : undefined}
    />
  );
}

const base = StyleSheet.create({
  centered: { alignItems: "center", justifyContent: "center" },
});

type DashboardProps = {
  store: MerchantStore;
  user: AuthUser;
  onSwitchStore?: () => void;
};

/** O painel (SCREENS.merchant do protótipo): ao vivo, estoque, usos por hora, validar e últimos. */
function Dashboard({ store, user, onSwitchStore }: DashboardProps) {
  const styles = useStyles();
  const router = useRouter();
  const focused = useIsFocused();
  const [period, setPeriod] = useState<MerchantPeriod>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const overview = useMerchantOverview(period, { live: focused });
  const refreshControl = useRefreshControl(overview.refetch);
  const view = queryView(overview);

  const data = overview.data;
  const coupons = data?.coupons ?? [];
  const selected = coupons.find((c) => c.id === selectedId) ?? coupons[0] ?? null;

  const openMenu = () =>
    openMerchantMenu({
      user,
      onSwitchStore,
      onChangePassword: () => router.push("/lojista/senha"),
    });

  return (
    <ScreenContainer top="none">
      {/* Android é edge-to-edge (a janela não encolhe com o teclado); no iOS a rolagem ajusta. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : undefined}
        style={styles.fill}
      >
        <ScrollView
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <MerchantHeader store={data?.store ?? store} onMenu={openMenu} />
          <Tabs
            items={PERIODS}
            value={period}
            onChange={(next) => {
              if (next === period) return;
              haptic.select();
              setPeriod(next);
            }}
            style={styles.tabs}
          />

          {data ? (
            <>
              {selected ? (
                <CouponCarousel
                  coupons={coupons}
                  selectedId={selected.id}
                  onSelect={setSelectedId}
                />
              ) : (
                <NoCouponHero />
              )}
              {selected ? <StockPanel coupon={selected} /> : null}
              {/* remonta quando chega o período novo: as barras crescem de novo */}
              <HourChart key={data.period} rows={data.redemptionsByHour} period={data.period} />
              <ValidatePanel />
              <LastUses items={data.lastRedemptions} period={data.period} />
            </>
          ) : view !== "ready" ? (
            <>
              <View style={styles.fallback}>
                <QueryFallback
                  view={view}
                  error={overview.error}
                  onRetry={() => void overview.refetch()}
                  retrying={overview.isFetching}
                  skeleton={<OverviewSkeleton />}
                />
              </View>
              {/* sem os números, o caixa continua validando */}
              {view !== "loading" ? <ValidatePanel /> : null}
            </>
          ) : null}
          <BottomSpacer kind="safe" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const useStyles = createStyles(() => ({
  fill: { flex: 1 },
  tabs: { marginTop: 18, flexGrow: 0 },
  fallback: { marginTop: 4 },
}));
