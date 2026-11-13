import { View } from "react-native";
import type { TrevoEntry } from "@/contracts/app/club";
import { useSession } from "@/core/auth/session";
import {
  BottomSpacer,
  createStyles,
  EmptyState,
  Icon,
  layout,
  NavHeader,
  ScreenContainer,
  SealBadge,
  Skeleton,
  Text,
  useColors,
} from "@/design";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useTrevoStatement } from "../api/club";
import { TrevoBalanceCard } from "../components/TrevoBalanceCard";
import { fullDate, monthYear, signedTrevos } from "../lib/club";

const STATUS_LABEL = {
  pending: "Esperando retirada",
  delivered: "Retirado",
  cancelled: "Cancelada · Trevos devolvidos",
} as const;

/** /carteira/trevos: saldo, validade e todo o histórico (conquistas e trocas). */
export default function TrevoStatementScreen() {
  const styles = useStyles();
  const signedIn = useSession((s) => s.status) === "signedIn";
  const query = useTrevoStatement();
  const refreshControl = useRefreshControl(query.refetch);
  const view = queryView(query);

  const groups = new Map<string, TrevoEntry[]>();
  for (const e of query.data?.entries ?? []) {
    const key = monthYear(e.at);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <ScreenContainer top="none" scroll scrollProps={{ refreshControl }}>
      <NavHeader title="Extrato de Trevos" />
      {!signedIn ? (
        <EmptyState
          icon="wallet"
          title="Entre para ver seus Trevos"
          text="Seu extrato aparece aqui."
          style={styles.empty}
        />
      ) : view !== "ready" || !query.data ? (
        <QueryFallback
          view={view === "ready" ? "loading" : view}
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          skeleton={
            <View style={styles.list}>
              <Skeleton height={150} radius={28} />
              <Skeleton height={64} />
              <Skeleton height={64} />
            </View>
          }
        />
      ) : (
        <>
          <View style={styles.top}>
            <TrevoBalanceCard
              total={query.data.total}
              validUntil={query.data.validUntil}
              onStatement={() => undefined}
            />
          </View>
          <Text variant="small" tone="textMuted" style={styles.note}>
            Selos não vencem: viram histórico.
            {query.data.validUntil
              ? ` Os Trevos valem para troca até ${fullDate(query.data.validUntil)}.`
              : ""}
          </Text>
          {query.data.entries.length === 0 ? (
            <EmptyState
              icon="award"
              title="Nada por aqui ainda"
              text="Cumpra desafios no Clube ARP para ganhar Trevos."
            />
          ) : (
            [...groups].map(([month, entries]) => (
              <View key={month}>
                <Text variant="h2" style={styles.month} accessibilityRole="header">
                  {month}
                </Text>
                <View style={styles.list}>
                  {entries.map((e) => (
                    <EntryRow key={`${e.kind}-${e.id}`} entry={e} />
                  ))}
                </View>
              </View>
            ))
          )}
        </>
      )}
      <BottomSpacer kind="safe" />
    </ScreenContainer>
  );
}

function EntryRow({ entry }: { entry: TrevoEntry }) {
  const styles = useStyles();
  const colors = useColors();
  const cancelled = entry.status === "cancelled";
  return (
    <View style={styles.row}>
      {entry.seal ? (
        <SealBadge seal={entry.seal} size={40} />
      ) : (
        <View style={styles.gift}>
          <Icon name="gift" size={20} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {entry.title}
        </Text>
        <Text variant="caption" tone="textMuted">
          {entry.kind === "earned"
            ? `Selo ${entry.seal?.name ?? ""} · ${fullDate(entry.at)}`
            : `${entry.status ? STATUS_LABEL[entry.status] : "Troca"} · ${fullDate(entry.at)}${entry.code && entry.status === "pending" ? ` · código ${entry.code}` : ""}`}
        </Text>
      </View>
      <Text
        variant="smallStrong"
        tabular
        tone={cancelled ? "textMuted" : entry.points > 0 ? "brandText" : "text"}
        style={cancelled ? styles.struck : undefined}
      >
        {signedTrevos(entry.points)}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  empty: { marginTop: 80 },
  top: { marginTop: 12 },
  note: { marginHorizontal: layout.gutter + 4, marginTop: 12 },
  month: { marginHorizontal: layout.gutter, marginTop: layout.sectionTop, marginBottom: 10 },
  list: { gap: 8, paddingHorizontal: layout.gutter },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: t.colors.surface,
  },
  gift: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  struck: { textDecorationLine: "line-through" },
}));
