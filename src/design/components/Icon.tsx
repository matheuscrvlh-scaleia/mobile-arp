import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { useColors } from "../theme/ThemeProvider";
import { ICONS, type KnownIconName } from "./icons";

/** Nome lucide em kebab-case. É string porque vem da API (cadastrado no ERP). */
export type IconName = KnownIconName | (string & {});

export type IconProps = {
  name: IconName;
  /** .ic = 20 */
  size?: number;
  /** Padrão: `text` do tema. */
  color?: string;
  strokeWidth?: number;
  /** Preenchimento do traço (lucide usa "none"): `fill={colors.danger}` no coração de favorito. */
  fill?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const FALLBACK = ICONS.circle;
const warned = new Set<string>();

export function hasIcon(name: string | null | undefined): name is KnownIconName {
  return !!name && Object.hasOwn(ICONS, name);
}

export const Icon = memo(function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
  fill,
  style,
  accessibilityLabel,
}: IconProps) {
  const colors = useColors();
  let Glyph = FALLBACK;
  if (hasIcon(name)) Glyph = ICONS[name];
  else if (__DEV__ && !warned.has(name)) {
    warned.add(name);
    console.warn(`[Icon] ícone não mapeado: "${name}" (usando "circle")`);
  }
  return (
    <Glyph
      size={size}
      color={color ?? colors.text}
      strokeWidth={strokeWidth}
      fill={fill ?? "none"}
      style={style}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
    />
  );
});
