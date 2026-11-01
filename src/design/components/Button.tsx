import { memo } from "react";
import type { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";
import { createStyles } from "../theme/createStyles";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { radii, typography } from "../tokens";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Spinner } from "./Spinner";
import { Text } from "./Text";

/**
 * - `dark`: contraste invertido (`inverse`): escuro no tema claro, CLARO no tema escuro.
 * - `brand`: verde com texto `onBrand`.
 * - `white`: superfície elevada (`surfaceRaised`): branca no claro, cinza-esverdeada no escuro.
 * - `soft`: `surface` (antigo card).
 * - `line`: contorno `border`.
 * - `lineLight`: contorno branco translúcido, sobre foto/cor viva (igual nos dois temas).
 */
export type ButtonVariant = "dark" | "brand" | "white" | "soft" | "line" | "lineLight";
export type ButtonSize = "md" | "sm";

export type ButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  /** md = .btn (58); sm = .sim-box .btn (48, fonte 14) */
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** Mostra o loader girando no lugar do ícone e bloqueia o toque. */
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

function foreground(c: Palette, variant: ButtonVariant): string {
  switch (variant) {
    case "dark":
      return c.onInverse;
    case "brand":
      return c.onBrand;
    case "lineLight":
      return c.onMedia;
    default:
      return c.text;
  }
}

export const Button = memo(function Button({
  label,
  onPress,
  variant = "dark",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const fg = foreground(colors, variant);
  const iconSize = size === "sm" ? 18 : 20;
  const blocked = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={blocked}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
      testID={testID}
      style={[
        styles.base,
        size === "sm" && styles.sm,
        styles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <Spinner size={iconSize} color={fg} />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={iconSize} color={fg} />
      ) : null}
      <Text style={[styles.label, size === "sm" && styles.labelSm]} color={fg} numberOfLines={1}>
        {label}
      </Text>
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} color={fg} /> : null}
    </PressableScale>
  );
});

const useStyles = createStyles((t) => ({
  base: {
    height: 58,
    borderRadius: radii.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    alignSelf: "stretch",
  },
  sm: { height: 48, borderRadius: 24, paddingHorizontal: 14, gap: 8 },
  dark: { backgroundColor: t.colors.inverse },
  brand: { backgroundColor: t.colors.brand },
  white: { backgroundColor: t.colors.surfaceRaised },
  soft: { backgroundColor: t.colors.surface },
  // box-shadow: inset 0 0 0 1.5px → borda (o border do RN também é interno)
  line: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: t.colors.border },
  lineLight: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: t.colors.onMediaLine,
  },
  disabled: { opacity: 0.45 },
  label: { ...typography.button, flexShrink: 1 },
  labelSm: { fontSize: 14, lineHeight: 18 },
}));
