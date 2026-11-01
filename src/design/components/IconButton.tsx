import { BlurView } from "expo-blur";
import { memo } from "react";
import {
  type GestureResponderEvent,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { createStyles } from "../theme/createStyles";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { hitSlop, motion } from "../tokens";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";

/**
 * `card` surface · `dark` inverse (claro no tema escuro) · `glass` vidro sobre foto (igual nos
 * dois temas) · `white` elevado com sombra (surfaceRaised).
 */
export type IconButtonVariant = "card" | "dark" | "glass" | "white";

export type IconButtonProps = {
  icon: IconName;
  /** Obrigatório: botão só com ícone precisa de nome para o leitor de tela. */
  accessibilityLabel: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: IconButtonVariant;
  /** .icon-btn = 46; dentro da .cta-bar = 58 */
  size?: number;
  iconSize?: number;
  /** Bolinha vermelha de novidade (.icon-btn .dot) */
  dot?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function foreground(c: Palette, variant: IconButtonVariant): string {
  if (variant === "dark") return c.onInverse;
  if (variant === "glass") return c.onMedia;
  return c.text;
}

export const IconButton = memo(function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = "card",
  size = 46,
  iconSize = 20,
  dot = false,
  disabled,
  style,
  testID,
}: IconButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <PressableScale
      scaleTo={motion.pressScale.icon}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      hitSlop={size < 44 ? hitSlop.sm : undefined}
      testID={testID}
      style={[styles.base, round, styles[variant], disabled && styles.disabled, style]}
    >
      {variant === "glass" && Platform.OS === "ios" ? (
        <BlurView intensity={24} tint="light" style={[StyleSheet.absoluteFill, round]} />
      ) : null}
      <Icon name={icon} size={iconSize} color={foreground(colors, variant)} />
      {dot ? <View style={styles.dot} /> : null}
    </PressableScale>
  );
});

const useStyles = createStyles((t) => ({
  base: { alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: t.colors.surface },
  dark: { backgroundColor: t.colors.inverse },
  // backdrop-filter: blur(12px): BlurView no iOS; no Android fica só o branco translúcido
  glass: { backgroundColor: t.colors.glass, overflow: "hidden" },
  white: { backgroundColor: t.colors.surfaceRaised, ...t.shadows.iconBtnWhite },
  disabled: { opacity: 0.45 },
  dot: {
    position: "absolute",
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: t.colors.danger,
    borderWidth: 2,
    borderColor: t.colors.surface,
  },
}));
