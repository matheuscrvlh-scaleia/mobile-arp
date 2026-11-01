import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../theme/ThemeProvider";

export type TrevoProps = {
  size?: number;
  /** Padrão: `brand`. */
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

const LEAF = "M0 0H-12A12 12 0 0 1 -24 -12A12 12 0 0 1 -12 -24A12 12 0 0 1 0 -12Z";
/** [rotação, escala] das quatro folhas, como no ui.jsx */
const LEAVES = [
  [0, 0.76],
  [90, 1],
  [180, 1],
  [270, 0.88],
] as const;

/** O trevo da marca ARP (marca d'água dos cartões verdes). */
export const Trevo = memo(function Trevo({ size = 60, color, opacity, style }: TrevoProps) {
  const colors = useColors();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-30 -30 60 60"
      fill={color ?? colors.brand}
      opacity={opacity}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {LEAVES.map(([r, s]) => (
        <Path key={r} d={LEAF} transform={`rotate(${r}) translate(-2.5 -2.5) scale(${s})`} />
      ))}
    </Svg>
  );
});
