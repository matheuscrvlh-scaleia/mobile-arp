import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import {
  createStyles,
  Icon,
  type IconName,
  PressableScale,
  TAB_BAR_HEIGHT,
  TAB_BAR_SIDE,
  Text,
  useColors,
  useTabBarInset,
} from "@/design";

/* Barra de abas flutuante (.nav do protótipo): pílula escura, aba ativa clara com rótulo e o leitor de QR no meio.
   Fica escura nos dois temas (`chrome`): no escuro um degrau acima do fundo, com fio claro de 1px
   (na sombra `nav`); o aro do botão de QR tem a cor do fundo da página, como um recorte. */

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Início", icon: "house" },
  cupons: { label: "Cupons", icon: "ticket-percent" },
  desafios: { label: "Selos", icon: "award" },
  mapa: { label: "Mapa", icon: "map" },
};

const layout = LinearTransition.springify().damping(18).stiffness(180);

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useStyles();
  const { bottom } = useTabBarInset();
  const routes = state.routes.filter((route) => route.name in TABS);
  const activeName = state.routes[state.index]?.name;
  const middle = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const tab = TABS[route.name];
    if (!tab) return null;
    const on = route.name === activeName;
    return (
      <Animated.View key={route.key} layout={layout}>
        <Pressable
          onPress={() => {
            if (on) return;
            void Haptics.selectionAsync();
            navigateToTab(route.key);
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: on }}
          accessibilityLabel={tab.label}
          style={[styles.tab, on && styles.tabOn]}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={on ? colors.onChromeActive : colors.onChromeMuted}
          />
          {on ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <Text
                variant="smallStrong"
                weight={700}
                color={colors.onChromeActive}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Animated.View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {routes.slice(0, middle).map(renderTab)}
        <PressableScale
          scaleTo={0.92}
          onPress={() => router.push("/ler-qr")}
          accessibilityRole="button"
          accessibilityLabel="Ler QR Code"
          style={styles.scan}
        >
          <Icon name="scan-line" size={26} color={colors.onBrand} />
        </PressableScale>
        {routes.slice(middle).map(renderTab)}
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { position: "absolute", left: TAB_BAR_SIDE, right: TAB_BAR_SIDE },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: t.colors.chrome,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    ...t.shadows.nav,
  },
  tab: {
    height: 52,
    minWidth: 52,
    borderRadius: 26,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabOn: { backgroundColor: t.colors.chromeActive },
  scan: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -16 }],
    boxShadow: `0 0 0 6px ${t.colors.bg}, 0 14px 24px -8px rgba(47, 125, 61, ${t.dark ? 0.5 : 0.7})`,
  },
}));
