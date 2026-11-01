import { memo } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Line } from "react-native-svg";
import { useColors } from "../theme/ThemeProvider";

export type DashedDividerProps = {
  /** Sobre chrome/tom escuro (.dashed.light): `dashedOnChrome`. Padrão: `dashed`. */
  light?: boolean;
  color?: string;
  /** 1.5 no .dashed; 2 no canhoto do cupom */
  thickness?: number;
  vertical?: boolean;
  /** Margem do .dashed: 14 acima e abaixo (horizontal). Passe 0 para controlar pelo style. */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
};

/** Linha tracejada (.dashed). SVG porque borderStyle dashed em um lado só falha no iOS. */
export const DashedDivider = memo(function DashedDivider({
  light = false,
  color,
  thickness = 1.5,
  vertical = false,
  spacing = vertical ? 0 : 14,
  style,
}: DashedDividerProps) {
  const colors = useColors();
  const stroke = color ?? (light ? colors.dashedOnChrome : colors.dashed);
  const dash = `${thickness * 3} ${thickness * 2.5}`;
  const mid = thickness / 2;
  return (
    <View
      style={[
        vertical
          ? { width: thickness, alignSelf: "stretch", marginHorizontal: spacing }
          : { height: thickness, alignSelf: "stretch", marginVertical: spacing },
        style,
      ]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      <Svg style={StyleSheet.absoluteFill}>
        {vertical ? (
          <Line
            x1={mid}
            y1={0}
            x2={mid}
            y2="100%"
            stroke={stroke}
            strokeWidth={thickness}
            strokeDasharray={dash}
          />
        ) : (
          <Line
            x1={0}
            y1={mid}
            x2="100%"
            y2={mid}
            stroke={stroke}
            strokeWidth={thickness}
            strokeDasharray={dash}
          />
        )}
      </Svg>
    </View>
  );
});
