import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import type { RecyclingItem } from "@/contracts/content";
import { mediaUrl } from "@/core/api/media";
import {
  BottomSpacer,
  Button,
  createStyles,
  hasIcon,
  IconButton,
  layout,
  Photo,
  radii,
  ScreenContainer,
  sheet,
  Text,
  useColors,
  useTopInset,
  withAlpha,
} from "@/design";
import { MonoTile, ResultRow } from "@/features/stores";
import { goBackOr, openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useContentPage, useRecyclingItems } from "../api/content";
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

const COVER_HEIGHT = 260;

/** Capa como a das lojas: foto da página "Sustentarp" (painel → Conteúdo) ou a cor da marca. */
function SustentarpCover() {
  const c = useColors();
  const styles = useStyles();
  const top = useTopInset("header");
  const { width } = useWindowDimensions();
  const page = useContentPage("sustentarp");
  const photo = mediaUrl(page.data?.fileUrl);
  return (
    <View style={[styles.cover, { backgroundColor: c.brand }]}>
      {photo ? (
        <Photo
          source={photo}
          displayWidth={width}
          style={[StyleSheet.absoluteFill, styles.transparent]}
        />
      ) : null}
      <LinearGradient
        colors={[withAlpha(c.scrim, 0.4), withAlpha(c.scrim, 0), withAlpha(c.scrim, 0.72)]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.coverTop, { paddingTop: top }]}>
        <IconButton
          icon="chevron-left"
          variant="glass"
          accessibilityLabel="Voltar"
          onPress={() => goBackOr("/")}
        />
      </View>
      <View style={styles.coverText}>
        <Text variant="title" tone="onMedia" accessibilityRole="header">
          Sustentarp
        </Text>
        <Text variant="small" tone="onMedia">
          O ponto de descarte da ARP
        </Text>
      </View>
    </View>
  );
}

/**
 * Sustentarp (/sustentarp): capa, o que pode ser descartado e o desafio.
 * "Seja um Amigo do Sustentarp" fica fora até a ARP decidir se entra e onde.
 */
export default function SustentarpScreen() {
  const c = useColors();
  const styles = useStyles();
  const items = useRecyclingItems();
  const view = queryView(items);
  const refreshControl = useRefreshControl(items.refetch);

  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <SustentarpCover />
        <View style={styles.pad}>
          <Text variant="body" tone="textSecondary" style={styles.intro}>
            Toque num item para ver o que ele aceita e o que vira.
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
  cover: { height: COVER_HEIGHT, overflow: "hidden", justifyContent: "space-between" },
  transparent: { backgroundColor: "transparent" },
  coverTop: { flexDirection: "row", paddingHorizontal: layout.gutter },
  coverText: { paddingHorizontal: layout.gutter, paddingBottom: 20, gap: 2 },
  pad: { paddingHorizontal: layout.gutter, marginBottom: 12 },
  intro: { marginTop: 16 },
  callout: {
    marginHorizontal: layout.gutter,
    marginTop: 20,
    padding: 18,
    borderRadius: radii.xl,
    gap: 8,
    alignItems: "flex-start",
  },
}));
