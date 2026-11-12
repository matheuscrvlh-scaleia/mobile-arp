import { useQuery } from "@tanstack/react-query";
import { Linking, View } from "react-native";
import type { NewsItem } from "@/contracts/app/engagement";
import { appApi } from "@/core/api/app-api";
import { isWebUrl, toAppPath } from "@/core/notifications/links";
import { queryKeys } from "@/core/query/keys";
import {
  BottomSpacer,
  createStyles,
  EmptyState,
  Icon,
  layout,
  motion,
  NavHeader,
  PressableScale,
  ScreenContainer,
  Skeleton,
  Text,
  toast,
  useColors,
} from "@/design";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { MINUTE_MS } from "@/shared/lib/time";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";

/** "12/11 às 18:30" no fuso de São Paulo. */
function when(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return `${day} às ${time}`;
}

/** Abre o destino do comunicado: link do site ou tela do app (arp://…, conferida como um push). */
function openNews(n: NewsItem) {
  const link = n.deepLink;
  if (!link) return;
  if (isWebUrl(link)) {
    Linking.openURL(link).catch(() => toast.show("Não foi possível abrir o link", "circle-x"));
    return;
  }
  openPath(toAppPath(link));
}

/** /novidades: comunicados que a ARP mandou a todos (do mais novo ao mais antigo). */
export default function NewsScreen() {
  const styles = useStyles();
  const query = useQuery({
    queryKey: queryKeys.news(),
    queryFn: ({ signal }) => appApi.news({ signal }),
    staleTime: 5 * MINUTE_MS,
    select: (r) => r.data,
  });
  const refreshControl = useRefreshControl(query.refetch);
  const view = queryView(query);

  return (
    <ScreenContainer top="none" scroll scrollProps={{ refreshControl }}>
      <NavHeader title="Novidades" />
      <View style={styles.list}>
        {view !== "ready" || !query.data ? (
          <QueryFallback
            view={view === "ready" ? "loading" : view}
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            skeleton={
              <View style={styles.list}>
                <Skeleton height={86} radius={22} />
                <Skeleton height={86} radius={22} />
                <Skeleton height={86} radius={22} />
              </View>
            }
          />
        ) : query.data.length === 0 ? (
          <EmptyState
            icon="bell"
            title="Você está em dia"
            text="Os comunicados da ARP aparecem aqui."
          />
        ) : (
          query.data.map((n) => <NewsRow key={n.id} item={n} />)
        )}
      </View>
      <BottomSpacer kind="safe" />
    </ScreenContainer>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const styles = useStyles();
  const colors = useColors();
  const linked = Boolean(item.deepLink);
  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={linked ? () => openNews(item) : undefined}
      disabled={!linked}
      accessibilityRole={linked ? "button" : "text"}
      accessibilityLabel={`${item.title}. ${item.body}`}
      style={styles.row}
    >
      <View style={styles.icon}>
        <Icon name="megaphone" size={20} color={colors.brandText} />
      </View>
      <View style={styles.text}>
        <Text variant="bodyStrong">{item.title}</Text>
        <Text variant="small" tone="textSecondary">
          {item.body}
        </Text>
        <Text variant="caption" tone="textMuted">
          {when(item.sentAt)}
        </Text>
      </View>
      {linked ? <Icon name="chevron-right" size={18} color={colors.textMuted} /> : null}
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  list: { gap: 10, paddingHorizontal: layout.gutter, paddingTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: t.colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: t.colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, minWidth: 0, gap: 4 },
}));
