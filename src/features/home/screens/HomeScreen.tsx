import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { useSession } from "@/core/auth/session";
import { BottomSpacer, ScreenContainer } from "@/design";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { refreshHome, useHome } from "../api/home";
import { EndingCoupons } from "../components/EndingCoupons";
import { HighlightCarousel } from "../components/HighlightCarousel";
import { HomeGreeting } from "../components/HomeGreeting";
import { BelowSkeleton, HeroSkeleton, MonthCardSkeleton } from "../components/HomeSkeleton";
import { GuestMonthCard, MonthCard } from "../components/MonthCard";
import { ShortcutGrid } from "../components/ShortcutGrid";
import { TodaySection } from "../components/TodaySection";

/** Início (aba "/"): SCREENS.home do protótipo. */
export default function HomeScreen() {
  const qc = useQueryClient();
  const home = useHome();
  const status = useSession((s) => s.status);
  const refreshControl = useRefreshControl(() => refreshHome(qc));
  const view = queryView(home);
  const data = home.data;

  return (
    <ScreenContainer scroll scrollProps={{ refreshControl }}>
      <HomeGreeting />

      {data ? (
        <HighlightCarousel items={data.highlights} />
      ) : view === "loading" ? (
        <HeroSkeleton />
      ) : null}

      <ShortcutGrid couponCount={data?.activeCouponsCount} />

      {status === "guest" ? (
        <GuestMonthCard />
      ) : data?.summary ? (
        <MonthCard summary={data.summary} />
      ) : status === "restoring" || view === "loading" || home.isFetching ? (
        <MonthCardSkeleton />
      ) : null}

      {view === "ready" && data ? (
        <>
          <EndingCoupons coupons={data.endingCoupons} />
          <TodaySection events={data.upcomingEvents} />
        </>
      ) : (
        <View style={view === "loading" ? undefined : styles.error}>
          <QueryFallback
            view={view === "ready" ? "loading" : view}
            skeleton={<BelowSkeleton />}
            error={home.error}
            onRetry={() => void home.refetch()}
            retrying={home.isFetching}
          />
        </View>
      )}

      <BottomSpacer />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: 12 },
});
