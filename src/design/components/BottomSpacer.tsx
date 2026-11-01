import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_CLEARANCE_GAP, TAB_BAR_HEIGHT, tabBarBottomOffset } from "../tokens";

export type TabBarInset = {
  /** Distância da barra flutuante até o fundo da tela */
  bottom: number;
  height: number;
  /** Quanto o conteúdo precisa sobrar no fim para não ficar sob a barra (.bottom-space) */
  clearance: number;
};

export function useTabBarInset(): TabBarInset {
  const insets = useSafeAreaInsets();
  const bottom = tabBarBottomOffset(insets.bottom);
  return {
    bottom,
    height: TAB_BAR_HEIGHT,
    clearance: bottom + TAB_BAR_HEIGHT + TAB_BAR_CLEARANCE_GAP,
  };
}

export type BottomSpacerProps = {
  /** `tabBar` (padrão) libera a barra de abas; `safe` só o safe area + 24. */
  kind?: "tabBar" | "safe";
  extra?: number;
};

/** Espaço no fim das listas/rolagens das telas com barra de abas (.bottom-space). */
export function BottomSpacer({ kind = "tabBar", extra = 0 }: BottomSpacerProps) {
  const { clearance } = useTabBarInset();
  const { bottom } = useSafeAreaInsets();
  const height = (kind === "tabBar" ? clearance : bottom + TAB_BAR_CLEARANCE_GAP) + extra;
  return <View style={{ height }} />;
}
