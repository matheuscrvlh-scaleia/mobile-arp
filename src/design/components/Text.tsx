import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from "react-native";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { themes } from "../theme/theme";
import { type FontWeight, fontFamily, type TypographyVariant, typography } from "../tokens";

/** Tons de texto do tema (nomes semânticos da paleta). */
type SemanticTone =
  | "text"
  | "textSecondary"
  | "textMuted"
  | "textSubtle"
  | "brand"
  | "brandText"
  | "onBrand"
  | "danger"
  | "dangerText"
  | "onInverse"
  | "onChrome"
  | "onChromeMuted"
  | "onMedia";

/** Nomes antigos (paleta estática), aceitos durante a migração. */
type LegacyTone =
  | "ink"
  | "ink2"
  | "muted"
  | "white"
  | "brand700"
  | "clay"
  | "clayInk"
  | "onDarkMuted";

const LEGACY: Record<LegacyTone, SemanticTone> = {
  ink: "text",
  ink2: "textSecondary",
  muted: "textMuted",
  // branco sobre escuro/foto: fixo nos dois temas
  white: "onMedia",
  brand700: "brandText",
  clay: "danger",
  clayInk: "dangerText",
  onDarkMuted: "onChromeMuted",
};

export type TextTone = SemanticTone | LegacyTone;

function toneColor(colors: Palette, tone: TextTone): string {
  const key: SemanticTone = Object.hasOwn(LEGACY, tone)
    ? LEGACY[tone as LegacyTone]
    : (tone as SemanticTone);
  return colors[key];
}

/**
 * @deprecated Cores do tema claro, estáticas. Use `tone` no `<Text>` ou `useColors()`.
 */
export const textTones = {
  ink: themes.light.colors.text,
  ink2: themes.light.colors.textSecondary,
  muted: themes.light.colors.textMuted,
  white: themes.light.colors.onMedia,
  brand: themes.light.colors.brand,
  brand700: themes.light.colors.brandText,
  clay: themes.light.colors.danger,
  clayInk: themes.light.colors.dangerText,
  onDarkMuted: themes.light.colors.onChromeMuted,
} as const;

/** Variantes de typography + `muted` (corpo em cinza, como `.muted`). */
export type TextVariant = TypographyVariant | "muted";

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Cor do tema (padrão `text`; `textMuted` na variante `muted`). */
  tone?: TextTone;
  /** Cor livre (tem prioridade sobre `tone`). Prefira `tone`: cor crua não muda com o tema. */
  color?: string;
  /** Troca o peso mantendo o tamanho da variante (sempre via família Geist). */
  weight?: FontWeight;
  align?: "left" | "center" | "right";
  /** font-variant-numeric: tabular-nums */
  tabular?: boolean;
};

export function Text({
  variant = "body",
  tone,
  color,
  weight,
  align,
  tabular,
  style,
  ...rest
}: TextProps) {
  const colors = useColors();
  const base = variant === "muted" ? styles.body : styles[variant];
  const resolvedTone = tone ?? (variant === "muted" ? "textMuted" : "text");
  return (
    <RNText
      {...rest}
      style={[
        base,
        { color: color ?? toneColor(colors, resolvedTone) },
        weight !== undefined && { fontFamily: fontFamily(weight) },
        align !== undefined && { textAlign: align },
        tabular && styles.tabular,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ...typography,
  tabular: { fontVariant: ["tabular-nums"] },
});
