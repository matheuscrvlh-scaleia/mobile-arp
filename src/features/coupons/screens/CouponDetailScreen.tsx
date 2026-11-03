import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, type ReactNode, useState } from "react";
import { ScrollView, View } from "react-native";
import type { CouponDetail } from "@/contracts/app/coupons";
import { errorMessage, isApiError } from "@/core/api/errors";
import { queryKeys } from "@/core/query/keys";
import {
  Button,
  CtaBar,
  createStyles,
  EmptyState,
  NavHeader,
  Pill,
  radii,
  ScreenContainer,
  Skeleton,
  SkeletonText,
  Text,
  toast,
  useCtaBarHeight,
  useTheme,
} from "@/design";
import { requireAuth } from "@/features/auth";
import { useStore, useToggleFollow } from "@/features/stores";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { haptic } from "@/shared/lib/haptics";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { isUncertainClaimError, useClaimCoupon, useConfirmClaim, useCoupon } from "../api/coupons";
import { CouponHero } from "../components/CouponHero";
import { CouponRules } from "../components/CouponRules";
import { StockGrid } from "../components/StockGrid";
import { StoreRow } from "../components/StoreRow";
import { isSoldOut } from "../lib/stock";
import { validDaysLabel, validToday } from "../lib/weekdays";
import { openNotAvailableSheet } from "../sheets/not-available";

export default function CouponDetailScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const query = useCoupon(id);
  const refreshControl = useRefreshControl(query.refetch);
  const coupon = query.data;
  const view = queryView(query);

  if (!coupon || view !== "ready") {
    let fallback: ReactElement;
    if (view === "error" && isApiError(query.error) && query.error.code === "NOT_FOUND") {
      fallback = (
        <EmptyState
          icon="ticket"
          title="Cupom não encontrado"
          text="Ele pode ter saído do ar. Veja os outros cupons da ARP."
          action={{ label: "Ver outros cupons", onPress: () => openPath("/cupons") }}
        />
      );
    } else {
      fallback = (
        <QueryFallback
          view={view === "ready" ? "loading" : view}
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          skeleton={<DetailSkeleton />}
        />
      );
    }
    return (
      <ScreenContainer top="none">
        <NavHeader />
        {fallback}
      </ScreenContainer>
    );
  }

  return (
    <CouponDetailView
      coupon={coupon}
      placeholder={query.isPlaceholderData}
      refreshControl={refreshControl}
      onRefresh={() => void query.refetch()}
    />
  );
}

type ViewProps = {
  coupon: CouponDetail;
  /** Cartão de uma lista enquanto o detalhe carrega: ainda sem `myClaim`. */
  placeholder: boolean;
  refreshControl: ReactElement;
  onRefresh: () => void;
};

function CouponDetailView({ coupon, placeholder, refreshControl, onRefresh }: ViewProps) {
  const router = useRouter();
  const styles = useStyles();
  const { dark } = useTheme();
  const qc = useQueryClient();
  const ctaHeight = useCtaBarHeight();
  const store = useStore(coupon.store.slug);
  const claim = useClaimCoupon();
  const confirmClaim = useConfirmClaim();
  const toggleFollow = useToggleFollow();
  const [checking, setChecking] = useState(false);
  const soldOut = isSoldOut(coupon.stock);
  const { myClaim } = coupon;
  const hours = coupon.redeemWindowHours;
  const following = store.data?.isFollowing ?? false;

  /** Sem resposta (timeout, rede, 5xx): o pego pode ter sido gravado. Confere antes de dizer que falhou. */
  const recover = (error: unknown) => {
    setChecking(true);
    toast.show("Conferindo sua carteira…", "wallet", { haptic: "none" });
    confirmClaim(coupon.id)
      .then((found) => {
        if (found) {
          haptic.success();
          toast.show(`Cupom garantido! Você tem ${hours}h para usar`, "ticket-check", {
            haptic: "none",
          });
          router.push(`/carteira/${found.id}`);
        } else {
          toast.show(errorMessage(error), "circle-x");
        }
      })
      .catch(() => toast.show(errorMessage(error), "circle-x"))
      .finally(() => setChecking(false));
  };

  const take = () =>
    claim.mutate(coupon.id, {
      onSuccess: (c) => {
        haptic.success();
        toast.show(`Cupom garantido! Você tem ${hours}h para usar`, "ticket-check", {
          haptic: "none",
        });
        router.push(`/carteira/${c.id}`);
      },
      onError: (error) => {
        const code = isApiError(error) ? error.code : null;
        if (code === "COUPON_SOLD_OUT") {
          // o hook já zerou o estoque aqui (refazer traria o valor velho do ERP)
          toast.show("Esse cupom acabou de esgotar", "circle-x");
        } else if (code === "COUPON_ALREADY_CLAIMED") {
          toast.show("Você já tem este cupom na carteira", "wallet");
          void qc.invalidateQueries({ queryKey: queryKeys.me.wallet("active"), exact: true });
          onRefresh();
        } else if (code === "COUPON_NOT_AVAILABLE") {
          onRefresh();
          openNotAvailableSheet(() => openPath("/cupons"));
        } else if (isUncertainClaimError(error)) {
          recover(error);
        } else {
          toast.show(errorMessage(error), "circle-x");
        }
      },
    });

  let cta: ReactNode;
  if (myClaim) {
    cta = (
      <Button
        label="Ver meu cupom"
        variant="brand"
        iconLeft="qr-code"
        onPress={() => router.push(`/carteira/${myClaim.id}`)}
      />
    );
  } else if (claim.isPending) {
    cta = <Button label="Garantindo seu cupom…" loading />;
  } else if (checking) {
    cta = <Button label="Conferindo sua carteira…" loading />;
  } else if (soldOut && following) {
    cta = <Button label="Vamos te avisar se voltar" variant="soft" iconLeft="bell-ring" disabled />;
  } else if (soldOut) {
    cta = (
      <Button
        label="Avise-me se voltar"
        variant="soft"
        iconLeft="bell"
        onPress={() =>
          toggleFollow(
            {
              id: coupon.store.id,
              slug: coupon.store.slug,
              name: coupon.store.name,
              isFollowing: following,
            },
            true,
          )
        }
      />
    );
  } else {
    cta = (
      <Button
        label="Pegar cupom"
        iconLeft="ticket-percent"
        disabled={placeholder}
        onPress={() => requireAuth(take)}
      />
    );
  }

  return (
    // ícones escuros só sobre o sand do tema claro (no escuro o sand é areia escura)
    <ScreenContainer top="none" statusBar={coupon.tone === "sand" && !dark ? "dark" : "light"}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ctaHeight + 20 }}
        refreshControl={refreshControl}
      >
        <CouponHero coupon={coupon} block={store.data?.block.name} />
        <View style={styles.body}>
          <View style={styles.stockHead}>
            {soldOut ? (
              <Text variant="h3">Esgotado por enquanto</Text>
            ) : (
              <Text variant="h3">
                Restam{" "}
                <Text variant="h3" tone="clay">
                  {coupon.stock.remaining}
                </Text>{" "}
                de {coupon.stock.total}
              </Text>
            )}
            {coupon.scheduleNote ? (
              <Pill label={coupon.scheduleNote} icon="calendar-days" style={styles.when} />
            ) : null}
            <Pill
              label={validDaysLabel(coupon.weekdays)}
              icon="calendar-check"
              style={styles.when}
            />
            {validToday(coupon.weekdays) ? null : (
              <Pill
                label="Hoje não vale: pegue e use num dia certo"
                icon="circle-alert"
                variant="clay"
                style={styles.when}
              />
            )}
          </View>
          <StockGrid stock={coupon.stock} mine={!!myClaim} />
          {coupon.description ? (
            <Text variant="muted" style={styles.description}>
              {coupon.description}
            </Text>
          ) : null}
          <CouponRules coupon={coupon} />
          <StoreRow store={coupon.store} detail={store.data} />
        </View>
      </ScrollView>
      <CtaBar>{cta}</CtaBar>
    </ScreenContainer>
  );
}

function DetailSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.skeleton}>
      <Skeleton height={260} radius={radii.cardLg} />
      <Skeleton width={180} height={18} />
      <Skeleton height={30} />
      <SkeletonText lines={4} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  body: {
    backgroundColor: t.colors.bg,
    borderTopLeftRadius: radii.cardLg,
    borderTopRightRadius: radii.cardLg,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  stockHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  when: { flexShrink: 1 },
  description: { marginTop: 18 },
  skeleton: { padding: 20, gap: 16 },
}));
