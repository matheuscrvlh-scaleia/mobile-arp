import { BlurView } from "expo-blur";
import { memo } from "react";
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { createStyles } from "../theme/createStyles";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { fontFamily, radii } from "../tokens";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

/**
 * `default` surface · `brand` tint verde · `dark` inverse (claro no tema escuro) · `clay` alerta ·
 * `glass` vidro sobre foto (igual nos dois temas) · `white` surfaceRaised.
 */
export type PillVariant = "default" | "brand" | "dark" | "clay" | "glass" | "white";

export type PillProps = {
  label: string;
  icon?: IconName;
  variant?: PillVariant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

function foreground(c: Palette, variant: PillVariant): string {
  switch (variant) {
    case "brand":
      return c.brandText;
    case "dark":
      return c.onInverse;
    case "clay":
      return c.dangerText;
    case "glass":
      return c.onMedia;
    default:
      return c.text;
  }
}

/** Etiqueta curta (.pill): 26 de altura, fonte 12/650. */
export const Pill = memo(function Pill({
  label,
  icon,
  variant = "default",
  style,
  accessibilityLabel,
}: PillProps) {
  const colors = useColors();
  const styles = useStyles();
  const fg = foreground(colors, variant);
  return (
    <View
      style={[styles.base, styles[variant], style]}
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {variant === "glass" && Platform.OS === "ios" ? (
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text style={styles.label} color={fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const useStyles = createStyles((t) => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  default: { backgroundColor: t.colors.surface },
  brand: { backgroundColor: t.colors.brand100 },
  dark: { backgroundColor: t.colors.inverse },
  clay: { backgroundColor: t.colors.dangerSoft },
  glass: { backgroundColor: t.colors.glass, overflow: "hidden" },
  white: { backgroundColor: t.colors.surfaceRaised },
  label: { fontFamily: fontFamily(650), fontSize: 12, lineHeight: 16 },
}));
