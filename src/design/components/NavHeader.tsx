import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { layout } from "../tokens";
import { IconButton, type IconButtonVariant } from "./IconButton";
import { useTopInset } from "./ScreenContainer";
import { Text } from "./Text";

export type NavHeaderProps = {
  title?: string;
  /** Botão à direita (normalmente um IconButton). Sem ele, um espaço de 46 mantém o título no centro. */
  right?: ReactNode;
  /** Variante do botão voltar: card (padrão), white (sobre tom/verde), glass (sobre foto). */
  backVariant?: IconButtonVariant;
  /** Esconde o voltar (ex.: Perfil, que é raiz de aba). */
  hideBack?: boolean;
  /** Substitui o voltar padrão (router.back, ou home se não houver para onde voltar). */
  onBack?: () => void;
  /** Título branco (`onMedia`), para cabeçalhos sobre foto ou fundo escuro fixo. */
  light?: boolean;
  /** Cor do título quando o fundo é de marca/fixo (ex.: `colors.onBrand` sobre verde). Vence `light`. */
  titleColor?: string;
  /**
   * Ícones da status bar. Sem a prop o cabeçalho não mexe nela (quem manda é o
   * ScreenContainer). `auto` segue o tema; `light` sobre foto/hero escuro.
   */
  statusBar?: "auto" | "dark" | "light";
  /** Soma o safe area do topo (.nav-head = status bar + 6). Desligue se a tela já cuida. */
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Cabeçalho de tela interna (.nav-head): voltar, título central e ação à direita. */
export function NavHeader({
  title,
  right,
  backVariant = "card",
  hideBack = false,
  onBack,
  light = false,
  titleColor,
  statusBar,
  safeTop = true,
  style,
}: NavHeaderProps) {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const paddingTop = useTopInset(safeTop ? "header" : "none");

  const back = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <View style={[styles.row, { paddingTop }, style]}>
      {statusBar ? (
        <StatusBar style={statusBar === "auto" ? (dark ? "light" : "dark") : statusBar} animated />
      ) : null}
      {hideBack ? (
        <View style={styles.slot} />
      ) : (
        <IconButton
          icon="chevron-left"
          variant={backVariant}
          onPress={back}
          accessibilityLabel="Voltar"
        />
      )}
      {title ? (
        <Text
          variant="h3"
          color={titleColor ?? (light ? colors.onMedia : colors.text)}
          align="center"
          numberOfLines={1}
          accessibilityRole="header"
          style={styles.title}
        >
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      {right ?? <View style={styles.slot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: layout.gutter,
  },
  slot: { width: 46, height: 46 },
  title: { flex: 1 },
});
