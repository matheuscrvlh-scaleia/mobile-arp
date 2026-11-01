import { Redirect, Tabs, usePathname } from "expo-router";
import { useSession } from "@/core/auth/session";
import { useColors } from "@/design";
import { onboarding } from "@/features/auth";
import { TabBar } from "@/navigation/TabBar";

export default function TabsLayout() {
  const status = useSession((s) => s.status);
  const pathname = usePathname();
  const colors = useColors();
  // Boas-vindas só na abertura normal: um link (QR de cartaz, push) vai direto ao destino.
  if (status === "guest" && pathname === "/" && !onboarding.isDone()) {
    return <Redirect href="/boas-vindas" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cupons" />
      <Tabs.Screen name="desafios" />
      <Tabs.Screen name="mapa" />
    </Tabs>
  );
}
