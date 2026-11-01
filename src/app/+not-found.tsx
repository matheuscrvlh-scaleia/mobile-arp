import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BottomSpacer, EmptyState, NavHeader, ScreenContainer } from "@/design";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <ScreenContainer top="none">
      <NavHeader />
      <View style={styles.center}>
        <EmptyState
          icon="search-x"
          title="Página não encontrada"
          text="O link pode ter mudado ou não existe mais. Tudo o que acontece na ARP continua no início."
          action={{ label: "Ir para o início", icon: "house", onPress: () => router.replace("/") }}
        />
      </View>
      <BottomSpacer kind="safe" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center" },
});
