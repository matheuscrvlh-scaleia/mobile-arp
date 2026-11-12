import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { mediaUrl } from "@/core/api/media";
import { useSession } from "@/core/auth/session";
import { Avatar, IconButton, layout, motion, PressableScale, SearchTrigger, Text } from "@/design";
import { WalletButton } from "@/navigation/HeaderButtons";
import { openPath } from "@/navigation/navigate";
import { useNow } from "@/shared/hooks/useNow";
import { formatLongDate, greeting } from "@/shared/lib/format";
import { firstName, initials } from "@/shared/lib/names";

/** Topo do Início (.hello + busca). O relógio vive só aqui (vira a saudação/data por minuto). */
export function HomeGreeting() {
  const router = useRouter();
  const visitor = useSession((s) => (s.status === "signedIn" ? s.visitor : null));
  const now = useNow(60_000);

  const title = visitor
    ? `Olá, ${firstName(visitor.name)}!`
    : `${greeting(new Date(now).getHours())}!`;

  return (
    <View style={styles.wrap}>
      <View style={styles.hello}>
        <PressableScale
          scaleTo={motion.pressScale.icon}
          onPress={() => router.push("/perfil")}
          accessibilityLabel={visitor ? "Abrir seu perfil" : "Perfil"}
        >
          <Avatar
            source={mediaUrl(visitor?.avatarUrl)}
            initials={visitor ? initials(visitor.name) : null}
            guest={!visitor}
          />
        </PressableScale>
        <View style={styles.texts}>
          <Text variant="h1" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          <Text variant="muted" style={styles.date}>
            {formatLongDate(now)}
          </Text>
        </View>
        <View style={styles.actions}>
          <WalletButton />
          <IconButton
            icon="bell"
            accessibilityLabel="Novidades"
            onPress={() => openPath("/novidades")}
          />
        </View>
      </View>
      <SearchTrigger
        label="Buscar lojas, restaurantes, eventos"
        onPress={() => router.push("/busca")}
        style={styles.search}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: layout.gutter },
  hello: { flexDirection: "row", alignItems: "center", gap: 12 },
  texts: { flex: 1, minWidth: 0 },
  actions: { flexDirection: "row", gap: 8 },
  date: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  search: { marginTop: 16 },
});
