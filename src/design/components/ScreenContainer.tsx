import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { layout } from "../tokens";

export type ScreenContainerProps = {
  children?: ReactNode;
  /**
   * Espaço no topo: `content` = status bar + 8 (.top), `header` = status bar + 6 (.nav-head),
   * `none` = nada (telas com capa/foto sob a status bar).
   */
  top?: "content" | "header" | "none";
  /**
   * Ícones da status bar. `auto` (padrão) segue o tema; `light` sobre foto/hero escuro (nos dois
   * temas); `dark` só sobre fundo claro fixo (ex.: tom sand no tema claro).
   */
  statusBar?: "auto" | "dark" | "light";
  /** Padrão: `bg` do tema. */
  background?: string;
  /** Envolve em ScrollView (sem barra de rolagem, como .screen). */
  scroll?: boolean;
  scrollProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle">;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function useTopInset(kind: "content" | "header" | "none" = "content"): number {
  const { top } = useSafeAreaInsets();
  if (kind === "none") return 0;
  return top + (kind === "header" ? layout.navHeadGap : layout.topGap);
}

/** Base de toda tela: fundo `bg` do tema, status bar e respiro do topo pelo safe area. */
export function ScreenContainer({
  children,
  top = "content",
  statusBar = "auto",
  background,
  scroll = false,
  scrollProps,
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  const paddingTop = useTopInset(top);
  const { colors, dark } = useTheme();
  const barStyle = statusBar === "auto" ? (dark ? "light" : "dark") : statusBar;
  return (
    <View style={[styles.fill, { backgroundColor: background ?? colors.bg }, style]}>
      <StatusBar style={barStyle} animated />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
          contentContainerStyle={[{ paddingTop }, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, { paddingTop }, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
