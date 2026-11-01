/* Peças do conteúdo de um painel, como nos sheets do protótipo (actions.jsx):
   ícone num quadrado (.sheet-ic), título (.sheet h3), texto (.sheet p) e botões (.btns). */
import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Icon, type IconName } from "../components/Icon";
import { Text } from "../components/Text";
import type { ThemeColor } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { resolveColor } from "../theme/theme";
import { fontFamily, tracking } from "../tokens";

/** Cor do tema pelo nome (`"inverse"`, resolvida ao desenhar) ou cor crua. */
export type SheetColor = ThemeColor | (string & {});

/** Cor do ícone que combina com cada fundo do tema (o resto usa `text`). */
const ICON_ON: Partial<Record<ThemeColor, ThemeColor>> = {
  brand: "onBrand",
  inverse: "onInverse",
  chrome: "onChrome",
  dangerSoft: "dangerText",
  danger: "onBrand",
  brand50: "brandText",
  brand100: "brandText",
};

export type SheetIconProps = {
  name: IconName;
  /**
   * Fundo do quadrado (padrão `"brand"`). Prefira o NOME da cor do tema (`"surface"`,
   * `"inverse"`, `"dangerSoft"`…): ele é resolvido na hora de desenhar e acompanha o tema, mesmo
   * em `sheet.message(...)` chamado fora do React.
   */
  background?: SheetColor;
  /** Padrão: a cor "on" do fundo (`onBrand`, `onInverse`, `dangerText`…) ou `text`. */
  color?: SheetColor;
  style?: StyleProp<ViewStyle>;
};

export function SheetIcon({ name, background = "brand", color, style }: SheetIconProps) {
  const colors = useColors();
  const matching = Object.hasOwn(ICON_ON, background)
    ? ICON_ON[background as ThemeColor]
    : undefined;
  const iconColor = color ?? matching ?? "text";
  return (
    <View style={[styles.icon, { backgroundColor: resolveColor(colors, background) }, style]}>
      <Icon name={name} size={30} color={resolveColor(colors, iconColor)} />
    </View>
  );
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

export function SheetText({ children }: { children: ReactNode }) {
  return (
    <Text variant="muted" style={styles.text}>
      {children}
    </Text>
  );
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily(800),
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: tracking(24, -0.03),
    marginBottom: 8,
  },
  text: { lineHeight: 22, marginBottom: 20 },
  actions: { gap: 10 },
});
