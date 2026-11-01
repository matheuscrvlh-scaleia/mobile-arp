import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { SealRef } from "@/contracts";
import { withAlpha } from "../theme/color";
import { createStyles } from "../theme/createStyles";
import { sealShadow } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { cssAngle } from "../tokens";
import { Icon } from "./Icon";

export type SealBadgeSeal = Pick<SealRef, "name" | "icon" | "gradientFrom" | "gradientTo">;

export type SealBadgeProps = {
  seal: SealBadgeSeal;
  /** .seal .sb-badge = 64; .won .big-badge = 196 */
  size?: number;
  /** Ainda não conquistado: cinza com o cadeado. */
  locked?: boolean;
  style?: StyleProp<ViewStyle>;
};

const DIR = cssAngle(145);

/** Selo (.badge do ui.jsx): círculo em gradiente 145deg, anel tracejado e ícone branco. */
export const SealBadge = memo(function SealBadge({
  seal,
  size = 64,
  locked = false,
  style,
}: SealBadgeProps) {
  const colors = useColors();
  const styles = useStyles();
  const round = { width: size, height: size, borderRadius: size / 2 };
  const big = size >= 140;
  const inset = big ? 12 : 5;
  const ringStyle = {
    top: inset,
    left: inset,
    right: inset,
    bottom: inset,
    borderRadius: (size - inset * 2) / 2,
    borderWidth: big ? 3 : 2,
  };
  const a11y = `Selo ${seal.name}${locked ? ", ainda não conquistado" : ""}`;

  return (
    <View
      style={[round, !locked && sealShadow(seal.gradientTo), style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11y}
    >
      {locked ? (
        <View style={[styles.center, round, styles.locked]}>
          <View style={[styles.ring, ringStyle, styles.ringLocked]} />
          <Icon name={seal.icon} size={size * 0.42} color={colors.onLocked} />
        </View>
      ) : (
        <LinearGradient
          colors={[seal.gradientFrom, seal.gradientTo]}
          start={DIR.start}
          end={DIR.end}
          style={[styles.center, round]}
        >
          <View style={[styles.ring, ringStyle]} />
          <Icon name={seal.icon} size={size * 0.42} color={colors.onMedia} />
        </LinearGradient>
      )}
      {locked ? (
        <View style={styles.lock}>
          <Icon name="lock" size={12} color={colors.textMuted} />
        </View>
      ) : null}
    </View>
  );
});

const useStyles = createStyles((t) => ({
  center: { alignItems: "center", justifyContent: "center" },
  locked: { backgroundColor: t.colors.locked },
  ring: {
    position: "absolute",
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.45)",
  },
  ringLocked: { borderColor: withAlpha(t.dark ? t.colors.onMedia : t.colors.scrim, 0.08) },
  lock: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    ...t.shadows.lockBubble,
  },
}));
