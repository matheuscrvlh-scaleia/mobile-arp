import { Linking, ScrollView, View } from "react-native";
import type { Job } from "@/contracts/content";
import { mediaUrl } from "@/core/api/media";
import {
  BottomSpacer,
  Button,
  createStyles,
  EmptyState,
  layout,
  NavHeader,
  Photo,
  radii,
  ScreenContainer,
  Text,
  toast,
  useColors,
} from "@/design";
import { useNow } from "@/shared/hooks/useNow";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { HOUR_MS } from "@/shared/lib/time";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useJobs } from "../api/content";
import { ContentSkeleton } from "../components/ContentSkeleton";

const DAY_MS = 24 * HOUR_MS;

/** "sai do ar hoje", "sai do ar em 1 dia", "sai do ar em 12 dias". */
export function jobLeftLabel(expiresAt: string, now: number): string {
  const days = Math.ceil((Date.parse(expiresAt) - now) / DAY_MS);
  if (days <= 1) return days <= 0 ? "sai do ar hoje" : "sai do ar em 1 dia";
  return `sai do ar em ${days} dias`;
}

function applyOnWhatsApp(job: Job) {
  const text = encodeURIComponent(`Olá! Vi a vaga de ${job.title} no app da ARP.`);
  Linking.openURL(`https://wa.me/${job.whatsapp}?text=${text}`).catch(() =>
    toast.show("Não foi possível abrir o WhatsApp", "circle-alert"),
  );
}

/** Vagas na ARP (/vagas, Fase 2): só no menu do perfil, sem destaque na Início. */
export default function JobsScreen() {
  const c = useColors();
  const styles = useStyles();
  const now = useNow(HOUR_MS);
  const jobs = useJobs();
  const view = queryView(jobs);
  const refreshControl = useRefreshControl(jobs.refetch);
  const live = (jobs.data ?? []).filter((j) => Date.parse(j.expiresAt) > now);

  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <NavHeader />
        <View style={styles.pad}>
          <Text variant="title" accessibilityRole="header">
            Vagas na ARP
          </Text>
          <Text variant="body" tone="textSecondary" style={styles.intro}>
            Oportunidades nas lojas e restaurantes da ARP. Fale direto com a loja pelo WhatsApp.
          </Text>
        </View>

        {view !== "ready" ? (
          <View style={styles.pad}>
            <QueryFallback
              view={view}
              skeleton={<ContentSkeleton rows={4} rowHeight={80} />}
              error={jobs.error}
              onRetry={() => void jobs.refetch()}
              retrying={jobs.isFetching}
            />
          </View>
        ) : live.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="Nenhuma vaga aberta agora"
            text="Quando uma loja publicar uma vaga, ela aparece aqui."
          />
        ) : (
          live.map((job) => (
            <View key={job.id} style={[styles.card, { backgroundColor: c.surface }]}>
              <Text variant="smallStrong" tone="textMuted">
                {job.store.name} · {jobLeftLabel(job.expiresAt, now)}
              </Text>
              <Text variant="bodyStrong">{job.title}</Text>
              {job.imageUrl ? (
                <Photo
                  source={mediaUrl(job.imageUrl)}
                  style={styles.image}
                  contentFit="contain"
                  displayWidth={320}
                />
              ) : null}
              {job.text ? (
                <Text variant="small" tone="textSecondary">
                  {job.text}
                </Text>
              ) : null}
              <Button
                label="Chamar no WhatsApp"
                iconLeft="message-circle"
                variant="dark"
                size="sm"
                onPress={() => applyOnWhatsApp(job)}
              />
            </View>
          ))
        )}
        <BottomSpacer kind="safe" />
      </ScrollView>
    </ScreenContainer>
  );
}

const useStyles = createStyles(() => ({
  pad: { paddingHorizontal: layout.gutter, marginBottom: 12 },
  intro: { marginTop: 8 },
  card: {
    marginHorizontal: layout.gutter,
    marginBottom: 12,
    padding: 18,
    borderRadius: radii.xl,
    gap: 8,
    alignItems: "flex-start",
  },
  image: { width: "100%", aspectRatio: 1, borderRadius: radii.lg },
}));
