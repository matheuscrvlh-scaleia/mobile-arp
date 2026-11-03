import { ScrollView, View } from "react-native";
import type { RecyclingItem } from "@/contracts/content";
import {
  BottomSpacer,
  Button,
  createStyles,
  hasIcon,
  layout,
  NavHeader,
  radii,
  ScreenContainer,
  sheet,
  Text,
  useColors,
} from "@/design";
import { MonoTile, ResultRow } from "@/features/stores";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useRecyclingItems } from "../api/content";
import { ContentSkeleton } from "../components/ContentSkeleton";

function openItemSheet(item: RecyclingItem) {
  sheet.message({
    icon: hasIcon(item.icon) ? item.icon : "recycle",
    title: item.name,
    text: [
      item.accepts && `Aceita: ${item.accepts}`,
      item.rejects && `Não aceita: ${item.rejects}`,
      item.becomes && `O que vira: ${item.becomes}`,
      item.givesSeal && "Este descarte conta para o desafio que vale selo no Clube ARP.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    actions: [{ label: "Fechar", variant: "soft" }],
  });
}

/** Sustentarp (/sustentarp, Fase 2): o que pode ser descartado e a chamada do desafio. */
export default function SustentarpScreen() {
  const c = useColors();
  const styles = useStyles();
  const items = useRecyclingItems();
  const view = queryView(items);
  const refreshControl = useRefreshControl(items.refetch);

  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <NavHeader />
        <View style={styles.pad}>
          <Text variant="title" accessibilityRole="header">
            Sustentarp
          </Text>
          <Text variant="body" tone="textSecondary" style={styles.intro}>
            O ponto de descarte da ARP. Toque num item para ver o que ele aceita e o que vira.
          </Text>
        </View>

        {view !== "ready" ? (
          <View style={styles.pad}>
            <QueryFallback
              view={view}
              skeleton={<ContentSkeleton rows={6} rowHeight={44} />}
              error={items.error}
              onRetry={() => void items.refetch()}
              retrying={items.isFetching}
            />
          </View>
        ) : (
          (items.data ?? []).map((item) => (
            <ResultRow
              key={item.id}
              leading={
                <MonoTile icon={hasIcon(item.icon) ? item.icon : "recycle"} color={c.brand} />
              }
              title={item.name}
              subtitle={item.givesSeal ? "Vale selo no Clube ARP" : item.becomes}
              onPress={() => openItemSheet(item)}
            />
          ))
        )}

        <View style={[styles.callout, { backgroundColor: c.surface }]}>
          <Text variant="bodyStrong">Desafio de descarte</Text>
          <Text variant="small" tone="textSecondary">
            Descarte no Sustentarp e leia o QR Code do ponto para ganhar o selo do mês.
          </Text>
          <Button
            label="Ver o desafio"
            variant="dark"
            size="sm"
            onPress={() => openPath("/desafios")}
          />
        </View>
        <BottomSpacer kind="safe" />
      </ScrollView>
    </ScreenContainer>
  );
}

const useStyles = createStyles(() => ({
  pad: { paddingHorizontal: layout.gutter, marginBottom: 12 },
  intro: { marginTop: 8 },
  callout: {
    marginHorizontal: layout.gutter,
    marginTop: 20,
    padding: 18,
    borderRadius: radii.xl,
    gap: 8,
    alignItems: "flex-start",
  },
}));
