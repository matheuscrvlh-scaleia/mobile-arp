import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  ART_POINT_KIND_LABEL,
  type ArtPoint,
  type ArtPointKind,
  artPointKindSchema,
} from "@/contracts/content";
import { mediaUrl } from "@/core/api/media";
import {
  BottomSpacer,
  Button,
  Chip,
  createStyles,
  type KnownIconName,
  layout,
  NavHeader,
  Photo,
  radii,
  ScreenContainer,
  SheetActions,
  SheetIcon,
  SheetTitle,
  sheet,
  Text,
  useColors,
} from "@/design";
import { MonoTile, ResultRow } from "@/features/stores";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useArtPoints, useContentPage } from "../api/content";
import { ContentSkeleton } from "../components/ContentSkeleton";

export const ART_KIND_ICON: Record<ArtPointKind, KnownIconName> = {
  work: "palette",
  memory: "landmark",
  sculpture: "gem",
  mural: "image",
};

/** Proporção do mapa do Circuito (largura / altura) enquanto a ARP não manda o oficial. */
const MAP_ASPECT = 4 / 5;

/** Ponto do Circuito como no site: foto grande, nome, artista, local e o texto. */
function openPointSheet(p: ArtPoint) {
  sheet.open(({ close }) => <PointDetail point={p} onClose={close} />, { scrollable: true });
}

function PointDetail({ point: p, onClose }: { point: ArtPoint; onClose: () => void }) {
  const styles = useStyles();
  const photo = mediaUrl(p.imageUrl);
  const paragraphs = p.description.split(/\n\s*\n|\n/).filter((s) => s.trim());
  return (
    <>
      {photo ? (
        <Photo source={photo} displayWidth={360} style={styles.pointPhoto} />
      ) : (
        <SheetIcon name={ART_KIND_ICON[p.kind]} background="brand" />
      )}
      <Text variant="caption" tone="brandText" weight={700} style={styles.pointKind}>
        {String(p.number).padStart(2, "0")} · {ART_POINT_KIND_LABEL[p.kind]}
      </Text>
      <SheetTitle>{p.name}</SheetTitle>
      {[p.artist, p.place].some(Boolean) ? (
        <Text variant="small" tone="textMuted" align="center">
          {[p.artist, p.place].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
      <View style={styles.pointText}>
        {paragraphs.length > 0 ? (
          paragraphs.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: parágrafos na ordem do texto
            <Text key={i} variant="body" tone="textSecondary">
              {s.trim()}
            </Text>
          ))
        ) : (
          <Text variant="body" tone="textMuted">
            Texto em preparação pela ARP.
          </Text>
        )}
      </View>
      <SheetActions>
        <Button label="Fechar" variant="soft" onPress={onClose} />
      </SheetActions>
    </>
  );
}

/**
 * Circuito Cultural (/circuito, Fase 2): mapa e lista dos pontos de arte,
 * filtro por tipo e a chamada do desafio. Sem rota nem navegação nesta fase.
 */
export default function CircuitScreen() {
  const c = useColors();
  const styles = useStyles();
  const intro = useContentPage("circuit");
  const points = useArtPoints();
  const view = queryView(points);
  const refreshControl = useRefreshControl(points.refetch);
  const [kind, setKind] = useState<ArtPointKind | null>(null);
  const list = (points.data ?? []).filter((p) => !kind || p.kind === kind);
  const kinds = artPointKindSchema.options.filter((k) => points.data?.some((p) => p.kind === k));
  const mapUrl = mediaUrl(intro.data?.fileUrl);
  const pinned = list.filter((p) => p.mapX !== null && p.mapY !== null);

  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <NavHeader />
        <View style={styles.pad}>
          <Text variant="title" accessibilityRole="header">
            Circuito Cultural
          </Text>
          {intro.data?.body ? (
            <Text variant="body" tone="textSecondary" style={styles.intro}>
              {intro.data.body}
            </Text>
          ) : null}
        </View>

        {mapUrl ? (
          <View style={[styles.map, { aspectRatio: MAP_ASPECT }]}>
            <Photo source={mapUrl} style={styles.mapImage} contentFit="contain" />
            {pinned.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => openPointSheet(p)}
                accessibilityRole="button"
                accessibilityLabel={`${p.number}. ${p.name}`}
                hitSlop={8}
                style={[
                  styles.pin,
                  { left: `${p.mapX}%`, top: `${p.mapY}%`, backgroundColor: c.brand },
                ]}
              >
                <Text variant="caption" weight={750} tone="onBrand" tabular>
                  {p.number}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="Todos" on={kind === null} onPress={() => setKind(null)} />
          {kinds.map((k) => (
            <Chip
              key={k}
              label={ART_POINT_KIND_LABEL[k]}
              icon={ART_KIND_ICON[k]}
              on={kind === k}
              onPress={() => setKind(k)}
            />
          ))}
        </ScrollView>

        {view !== "ready" ? (
          <View style={styles.pad}>
            <QueryFallback
              view={view}
              skeleton={<ContentSkeleton rows={6} rowHeight={44} />}
              error={points.error}
              onRetry={() => void points.refetch()}
              retrying={points.isFetching}
            />
          </View>
        ) : (
          list.map((p) => (
            <ResultRow
              key={p.id}
              leading={<MonoTile icon={ART_KIND_ICON[p.kind]} color={c.brand} />}
              title={`${p.number}. ${p.name}`}
              subtitle={[p.artist, p.place].filter(Boolean).join(" · ")}
              onPress={() => openPointSheet(p)}
            />
          ))
        )}

        <View style={[styles.callout, { backgroundColor: c.surface }]}>
          <Text variant="bodyStrong">Faça o Circuito Cultural</Text>
          <Text variant="small" tone="textSecondary">
            Visite as obras e ganhe o selo Fio Cultural no Clube ARP.
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
  pointPhoto: { alignSelf: "stretch", height: 220, borderRadius: 24, marginBottom: 14 },
  pointKind: { textAlign: "center", textTransform: "uppercase", marginBottom: 4 },
  pointText: { alignSelf: "stretch", gap: 10, marginTop: 12, marginBottom: 8 },
  pad: { paddingHorizontal: layout.gutter },
  intro: { marginTop: 8 },
  map: {
    marginHorizontal: layout.gutter,
    marginTop: 16,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  mapImage: { position: "absolute", inset: 0 },
  pin: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { gap: 8, paddingHorizontal: layout.gutter, paddingVertical: 16 },
  callout: {
    marginHorizontal: layout.gutter,
    marginTop: 20,
    padding: 18,
    borderRadius: radii.xl,
    gap: 8,
    alignItems: "flex-start",
  },
}));
