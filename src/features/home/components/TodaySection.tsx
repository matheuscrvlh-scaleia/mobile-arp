import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { EventCard } from "@/contracts/app/agenda";
import { STORE_KIND_LABEL, type StoreKind, storeKindSchema } from "@/contracts/directory";
import { EmptyState, layout, SectionHeader, type TabItem, Tabs } from "@/design";
import { STORE_KIND_ICONS, StoreCard, StoreCardSkeleton } from "@/features/stores";
import { useNow } from "@/shared/hooks/useNow";
import { toISODate } from "@/shared/lib/format";
import { MINUTE_MS } from "@/shared/lib/time";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useHomeStores } from "../api/home";
import { pairs } from "../lib/home";
import { EventDCard } from "./EventDCard";

type Tab = "events" | StoreKind;

const TABS: readonly TabItem<Tab>[] = [
  { value: "events", label: "Eventos" },
  ...storeKindSchema.options.map((k) => ({ value: k, label: STORE_KIND_LABEL[k] })),
];

const EMPTY_TITLE: Record<StoreKind, string> = {
  shop: "Nenhuma loja por aqui",
  food: "Nenhum restaurante por aqui",
  service: "Nenhum serviço por aqui",
};

/** "Hoje na ARP": abas Eventos | Lojas | Gastronomia | Serviços e grade de 2 colunas (.dgrid). */
export function TodaySection({ events }: { events: readonly EventCard[] }) {
  const [tab, setTab] = useState<Tab>("events");
  const today = toISODate(useNow(MINUTE_MS));
  return (
    <View>
      <SectionHeader title="Hoje na ARP" style={styles.header} />
      <Tabs items={TABS} value={tab} onChange={setTab} style={styles.tabs} />
      {tab === "events" ? (
        <EventsGrid events={events.slice(0, 4)} today={today} />
      ) : (
        // key: cada aba é uma consulta nova (sem mostrar as lojas da outra aba no meio)
        <StoresGrid key={tab} kind={tab} />
      )}
    </View>
  );
}

function EventsGrid({ events, today }: { events: readonly EventCard[]; today: string }) {
  const router = useRouter();
  if (events.length === 0) {
    return (
      <EmptyState
        compact
        icon="calendar-days"
        title="Nenhum evento por agora"
        text="Confira a agenda para ver o que vem por aí."
        action={{ label: "Ver agenda", onPress: () => router.push("/agenda") }}
      />
    );
  }
  return (
    <Grid
      cells={events.map((e, i) => <EventDCard key={e.id} event={e} today={today} dark={i === 0} />)}
    />
  );
}

function StoresGrid({ kind }: { kind: StoreKind }) {
  const router = useRouter();
  const stores = useHomeStores(kind);
  const view = queryView(stores);

  if (view !== "ready" || !stores.data) {
    return (
      <QueryFallback
        view={view === "ready" ? "loading" : view}
        skeleton={<SkeletonGrid />}
        error={stores.error}
        onRetry={() => void stores.refetch()}
        retrying={stores.isFetching}
      />
    );
  }
  const list = stores.data.data;
  if (list.length === 0) {
    return (
      <EmptyState
        compact
        icon={STORE_KIND_ICONS[kind]}
        title={EMPTY_TITLE[kind]}
        text="Volte mais tarde para ver as novidades."
        action={{
          label: "Explorar",
          onPress: () => router.push({ pathname: "/lojas", params: { tipo: kind } }),
        }}
      />
    );
  }
  return <Grid cells={list.map((s, i) => <StoreCard key={s.id} store={s} dark={i === 0} />)} />;
}

/** Duas colunas de mesma altura por linha (o grid do CSS estica a linha), como na grade de lojas. */
function Grid({ cells }: { cells: ReactNode[] }) {
  return (
    <View style={styles.grid}>
      {pairs(cells).map(([a, b], i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas derivadas da ordem dos cards
        <View key={i} style={styles.row}>
          <View style={styles.cell}>{a}</View>
          <View style={styles.cell}>{b ?? null}</View>
        </View>
      ))}
    </View>
  );
}

/** Grade carregando: o mesmo esqueleto de card da feature de lojas (mesmo tamanho do card de evento). */
export function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      {[0, 1].map((r) => (
        <View key={r} style={styles.row}>
          <View style={styles.cell}>
            <StoreCardSkeleton />
          </View>
          <View style={styles.cell}>
            <StoreCardSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 6 },
  tabs: { marginBottom: 12, flexGrow: 0 },
  grid: { paddingHorizontal: layout.gutter, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  cell: { flex: 1 },
});
