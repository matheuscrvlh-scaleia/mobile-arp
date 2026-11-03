import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler, Linking, ScrollView, View } from "react-native";
import { type ContentPageKey, contentPageKeySchema } from "@/contracts/content";
import { mediaUrl } from "@/core/api/media";
import {
  BottomSpacer,
  Button,
  createStyles,
  layout,
  NavHeader,
  ScreenContainer,
  Text,
  toast,
} from "@/design";
import { useFinishOnboarding } from "@/features/auth";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useContentPage } from "../api/content";
import { ContentSkeleton } from "../components/ContentSkeleton";

/** Primeiro acesso (conta nova): Nossa história → Regras da ARP → volta para onde estava. */
const ONBOARDING_NEXT: Partial<Record<ContentPageKey, ContentPageKey>> = { history: "rules" };

/**
 * Texto da ARP (/texto/history|rules|club_rules). Com `boasVindas=1`, faz
 * parte do primeiro acesso: sem voltar, com o botão para seguir.
 */
export default function ContentPageScreen() {
  const styles = useStyles();
  const router = useRouter();
  const finishOnboarding = useFinishOnboarding();
  const params = useLocalSearchParams<{ key?: string; boasVindas?: string }>();
  const parsed = contentPageKeySchema.safeParse(params.key);
  const key: ContentPageKey = parsed.success ? parsed.data : "history";
  const onboarding = params.boasVindas === "1";
  const query = useContentPage(key);
  const view = queryView(query);
  const page = query.data;
  const next = ONBOARDING_NEXT[key];

  // No primeiro acesso não há voltar (o cadastro já terminou): só o botão para seguir.
  useEffect(() => {
    if (!onboarding) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [onboarding]);

  const advance = () => {
    if (next) router.replace({ pathname: "/texto/[key]", params: { key: next, boasVindas: "1" } });
    else finishOnboarding();
  };

  const download = () => {
    const url = mediaUrl(page?.fileUrl);
    if (url)
      Linking.openURL(url).catch(() => toast.show("Não foi possível abrir o PDF", "circle-x"));
  };

  return (
    <ScreenContainer top="none">
      <Stack.Screen options={{ gestureEnabled: !onboarding }} />
      <NavHeader hideBack={onboarding} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {view !== "ready" || !page ? (
          <QueryFallback
            view={view === "ready" ? "loading" : view}
            skeleton={<ContentSkeleton />}
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : (
          <>
            {onboarding ? (
              <Text variant="smallStrong" tone="brand">
                {key === "history" ? "Bem-vindo à ARP" : "Antes de começar"}
              </Text>
            ) : null}
            <Text variant="title" accessibilityRole="header" style={styles.title}>
              {page.title}
            </Text>
            {page.body ? (
              page.body.split(/\n\s*\n/).map((p, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: parágrafos na ordem do texto
                <Text key={i} variant="body" tone="textSecondary" style={styles.para}>
                  {p.trim()}
                </Text>
              ))
            ) : (
              <Text variant="body" tone="textMuted">
                Texto em preparação pela ARP.
              </Text>
            )}
          </>
        )}
        <BottomSpacer kind="safe" />
      </ScrollView>
      {(page?.fileUrl && key === "rules") || onboarding ? (
        <View style={styles.actions}>
          {page?.fileUrl && key === "rules" ? (
            <Button
              label="Baixar as regras (PDF)"
              iconLeft="download"
              variant={onboarding ? "soft" : "dark"}
              onPress={download}
            />
          ) : null}
          {onboarding ? (
            <Button label={next ? "Continuar" : "Começar"} variant="dark" onPress={advance} />
          ) : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const useStyles = createStyles(() => ({
  body: { paddingHorizontal: layout.gutter, paddingTop: 8 },
  title: { marginTop: 6, marginBottom: 14 },
  para: { marginBottom: 14 },
  actions: { paddingHorizontal: layout.gutter, paddingBottom: 28, paddingTop: 8, gap: 10 },
}));
