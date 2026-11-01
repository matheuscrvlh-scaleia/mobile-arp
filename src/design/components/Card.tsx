import type { ReactNode } from "react";
import type { GestureResponderEvent, StyleProp, ViewProps, ViewStyle } from "react-native";
import { View } from "react-native";
import { createStyles } from "../theme/createStyles";
import { motion, radii } from "../tokens";
import { PressableScale } from "./PressableScale";

/**
 * Fundo do bloco:
 * - `surface` (padrão, antigo `card`), `surfaceStrong` (antigo `sand`), `surfaceRaised`
 *   (antigo `white`), `brand50`;
 * - `chrome`: cartão escuro (.dcard.dark) que continua escuro nos dois temas (antigo `ink`);
 * - `inverse`: escuro no claro, claro no escuro.
 * Os nomes antigos (`card`, `white`, `ink`, `sand`) seguem aceitos durante a migração.
 */
export type SurfaceTone =
  | "surface"
  | "surfaceStrong"
  | "surfaceRaised"
  | "brand50"
  | "chrome"
  | "inverse"
  /** @deprecated use `surface` */
  | "card"
  /** @deprecated use `surfaceRaised` (ou `bg`, via style) */
  | "white"
  /** @deprecated use `chrome` */
  | "ink"
  /** @deprecated use `surfaceStrong` */
  | "sand";

export type SurfaceProps = ViewProps & {
  tone?: SurfaceTone;
  radius?: number;
  padding?: number;
};

/** Bloco com fundo e cantos arredondados (padrão: .dcard — surface, raio 28, padding 16). */
export function Surface({
  tone = "surface",
  radius = radii.card,
  padding = 16,
  style,
  ...rest
}: SurfaceProps) {
  const styles = useStyles();
  return <View {...rest} style={[styles[tone], { borderRadius: radius, padding }, style]} />;
}

export type CardProps = {
  children?: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  tone?: SurfaceTone;
  radius?: number;
  padding?: number;
  /** .cp:active / .mcard:active = .98; .mini-cp .97 */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

/** Surface tocável, com o afundar dos cartões. */
export function Card({
  children,
  onPress,
  tone = "surface",
  radius = radii.card,
  padding = 16,
  scaleTo = motion.pressScale.card,
  style,
  ...a11y
}: CardProps) {
  const styles = useStyles();
  return (
    <PressableScale
      {...a11y}
      onPress={onPress}
      scaleTo={scaleTo}
      style={[styles[tone], { borderRadius: radius, padding }, style]}
    >
      {children}
    </PressableScale>
  );
}

const useStyles = createStyles((t) => {
  const chrome = { backgroundColor: t.colors.chrome, ...t.shadows.cardDark };
  return {
    surface: { backgroundColor: t.colors.surface },
    surfaceStrong: { backgroundColor: t.colors.surfaceStrong },
    surfaceRaised: { backgroundColor: t.colors.surfaceRaised },
    brand50: { backgroundColor: t.colors.brand50 },
    chrome,
    inverse: { backgroundColor: t.colors.inverse },
    card: { backgroundColor: t.colors.surface },
    white: { backgroundColor: t.colors.surfaceRaised },
    ink: chrome,
    sand: { backgroundColor: t.colors.surfaceStrong },
  };
});
