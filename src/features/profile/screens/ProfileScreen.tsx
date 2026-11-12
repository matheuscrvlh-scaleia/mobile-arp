import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { mediaUrl } from "@/core/api/media";
import { sessionActions, useSession } from "@/core/auth/session";
import { useMerchantSession } from "@/core/merchant/merchant-session";
import {
  BottomSpacer,
  Button,
  IconButton,
  layout,
  NavHeader,
  Pill,
  radii,
  ScreenContainer,
  Skeleton,
  Switch,
  Text,
  toast,
  useTheme,
  useThemePreference,
} from "@/design";
import { MERCHANT_HOME } from "@/features/merchant";
import { useFavoriteStores } from "@/features/stores";
import { WalletButton } from "@/navigation/HeaderButtons";
import { openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { plural } from "@/shared/lib/format";
import { initials } from "@/shared/lib/names";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { useMe } from "../api/me";
import { Menu, MenuItem } from "../components/Menu";
import { ProfileHead } from "../components/ProfileHead";
import { SavingsCard } from "../components/SavingsCard";
import { StatRow } from "../components/StatRow";
import { useNotificationSetting } from "../hooks/useNotificationSetting";
import { memberSince } from "../lib/profile";
import { openAppearanceSheet, THEME_PREFERENCE_LABEL } from "../sheets/appearance-sheet";
import { openAboutSheet, openSignOutSheet } from "../sheets/profile-sheets";

export default function ProfileScreen() {
  const signedIn = useSession((s) => s.status === "signedIn");
  return signedIn ? <SignedInProfile /> : <GuestProfile />;
}

function GuestProfile() {
  const router = useRouter();
  return (
    <ScreenContainer top="none" scroll>
      <NavHeader title="Perfil" />
      <View style={styles.guestHead}>
        <ProfileHead
          guest
          title="Você está como visitante"
          subtitle="Lojas, eventos e mapa estão liberados. Para cupons e selos, crie sua conta."
        />
      </View>
      <View style={styles.guestButtons}>
        <Button
          label="Criar conta grátis"
          iconRight="arrow-right"
          onPress={() => router.push("/cadastro")}
        />
        <Button label="Já tenho conta" variant="soft" onPress={() => router.push("/entrar")} />
      </View>
      <Menu>
        <AppearanceItem />
        <MerchantItem />
        <ContentItems />
        <MenuItem icon="info" label="Sobre a ARP" onPress={openAboutSheet} last />
      </Menu>
      <BottomSpacer kind="safe" />
    </ScreenContainer>
  );
}

function SignedInProfile() {
  const router = useRouter();
  const cachedVisitor = useSession((s) => s.visitor);
  const me = useMe();
  const favorites = useFavoriteStores();
  const notifications = useNotificationSetting();
  const refreshControl = useRefreshControl(me.refetch, favorites.refetch);
  const summaryView = queryView(me);

  const visitor = me.data?.visitor ?? cachedVisitor;
  const summary = me.data?.summary;
  const points = summary?.clubPoints ?? 0;
  const activeClaims = summary?.activeClaims ?? 0;
  const favoriteCount = favorites.data?.length;

  const signOut = () =>
    openSignOutSheet(() => {
      openPath("/");
      void sessionActions.signOut();
      toast.show("Você saiu da conta", "log-out");
    });

  return (
    <ScreenContainer top="none" scroll scrollProps={{ refreshControl }}>
      <NavHeader
        title="Perfil"
        right={
          <View style={styles.headActions}>
            <WalletButton />
            <IconButton
              icon="settings"
              accessibilityLabel="Dados da conta"
              onPress={() => router.push("/conta")}
            />
          </View>
        }
      />

      {visitor ? (
        <ProfileHead
          title={visitor.name}
          subtitle={`Na ARP desde ${memberSince(visitor.createdAt)}`}
          avatarUrl={mediaUrl(visitor.avatarUrl)}
          initials={initials(visitor.name)}
          badge={summary ? `${plural(points, "Trevo", "Trevos")} no Clube ARP` : undefined}
        />
      ) : (
        <View style={styles.headSkeleton}>
          <Skeleton width={92} height={92} radius={radii.round} />
          <Skeleton width={180} height={26} radius={8} />
          <Skeleton width={150} height={16} radius={6} />
        </View>
      )}

      {summary ? (
        <>
          <SavingsCard summary={summary} />
          <StatRow
            items={[
              {
                icon: "award",
                value: summary.clubPoints.toLocaleString("pt-BR"),
                label: summary.clubPoints === 1 ? "trevo" : "trevos",
                onPress: () => openPath("/desafios"),
              },
              {
                icon: "ticket-check",
                value: String(activeClaims),
                label: plural(activeClaims, "cupom ativo", "cupons ativos", false),
                onPress: () => router.push("/carteira"),
              },
              {
                icon: "heart",
                value: favoriteCount === undefined ? "–" : String(favoriteCount),
                label: "favoritas",
                onPress: () => router.push("/favoritos"),
              },
            ]}
          />
        </>
      ) : summaryView !== "ready" ? (
        <View style={styles.fallback}>
          <QueryFallback
            view={summaryView}
            error={me.error}
            onRetry={() => void me.refetch()}
            retrying={me.isFetching}
            skeleton={
              <View style={styles.cardsSkeleton}>
                <Skeleton height={168} radius={radii.cardLg} />
                <View style={styles.statsSkeleton}>
                  <Skeleton height={96} radius={radii.lg} style={styles.flex} />
                  <Skeleton height={96} radius={radii.lg} style={styles.flex} />
                  <Skeleton height={96} radius={radii.lg} style={styles.flex} />
                </View>
              </View>
            }
          />
        </View>
      ) : null}

      <Menu>
        <MenuItem
          icon="ticket-percent"
          label="Meus cupons"
          onPress={() => router.push("/carteira")}
          right={
            activeClaims > 0 ? (
              <Pill variant="dark" label={plural(activeClaims, "ativo", "ativos")} />
            ) : null
          }
        />
        <MenuItem
          icon="heart"
          label="Lojas favoritas"
          onPress={() => router.push("/favoritos")}
          right={
            favoriteCount ? (
              <Text variant="small" tone="textMuted" tabular>
                {favoriteCount}
              </Text>
            ) : null
          }
        />
        <MenuItem
          icon="bell"
          label="Notificações"
          noChevron
          onPress={() => void notifications.toggle(!notifications.value)}
          right={
            <Switch
              value={notifications.value}
              disabled={notifications.busy}
              onValueChange={(next) => void notifications.toggle(next)}
              accessibilityLabel="Notificações"
            />
          }
        />
        <MenuItem
          icon="shield-check"
          label="Dados e privacidade"
          onPress={() => router.push("/conta")}
        />
        <AppearanceItem />
        <MerchantItem />
        <ContentItems />
        <MenuItem icon="info" label="Sobre a ARP" onPress={openAboutSheet} />
        <MenuItem icon="log-out" label="Sair" danger noChevron onPress={signOut} last />
      </Menu>
      <BottomSpacer kind="safe" />
    </ScreenContainer>
  );
}

/** Tema do app (Automático / Claro / Escuro): para visitante e para quem tem conta. */
function AppearanceItem() {
  const [preference] = useThemePreference();
  const { dark } = useTheme();
  const current = THEME_PREFERENCE_LABEL[preference];
  return (
    <MenuItem
      icon={dark ? "moon" : "sun"}
      label="Aparência"
      onPress={openAppearanceSheet}
      accessibilityHint={`Atual: ${current}. Abre as opções de tema`}
      right={
        <Text variant="small" tone="textMuted">
          {current}
        </Text>
      }
    />
  );
}

/** Área do lojista (sessão própria, independente da conta de visitante). */
function MerchantItem() {
  const router = useRouter();
  const storeName = useMerchantSession((s) =>
    s.status === "signedIn"
      ? (s.profile?.stores.find((store) => store.id === s.profile?.storeId)?.name ?? "Conectado")
      : null,
  );
  return (
    <MenuItem
      icon="store"
      label="Área do lojista"
      onPress={() => router.push(MERCHANT_HOME)}
      accessibilityHint="Abre o painel para validar cupons no caixa da loja"
      right={
        storeName ? (
          <Text variant="small" tone="textMuted" numberOfLines={1} style={styles.merchantStore}>
            {storeName}
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  headActions: { flexDirection: "row", gap: 8 },
  merchantStore: { maxWidth: 120 },
  flex: { flex: 1 },
  guestHead: { marginTop: 20 },
  guestButtons: { marginTop: 20, paddingHorizontal: layout.gutter, gap: 10 },
  headSkeleton: { alignItems: "center", gap: 12, paddingTop: 8 },
  fallback: { marginTop: 22 },
  cardsSkeleton: { paddingHorizontal: layout.gutter, gap: 12 },
  statsSkeleton: { flexDirection: "row", gap: 10 },
});

/** Conteúdo da ARP no menu (Fase 2), com pouco destaque: vagas e textos. */
function ContentItems() {
  const router = useRouter();
  const text = (key: "history" | "rules" | "club_rules") => () =>
    router.push({ pathname: "/texto/[key]", params: { key } });
  return (
    <>
      <MenuItem icon="briefcase" label="Vagas na ARP" onPress={() => router.push("/vagas")} />
      <MenuItem icon="landmark" label="Nossa história" onPress={text("history")} />
      <MenuItem icon="book-open" label="Regras da ARP" onPress={text("rules")} />
      <MenuItem icon="medal" label="Regulamento do Clube ARP" onPress={text("club_rules")} />
    </>
  );
}
