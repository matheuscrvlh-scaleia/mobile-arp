import { memo } from "react";
import type { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { fontFamily, radii } from "../tokens";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export type ChipProps = {
  label: string;
  /** Selecionado: fundo `inverse` (escuro no claro, claro no escuro). */
  on?: boolean;
  icon?: IconName;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Filtro em linha (.chip): 40 de altura, fonte 14/600. Use dentro de um ScrollView horizontal
    com `contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}` (.chips). */
export const Chip = memo(function Chip({
  label,
  on = false,
  icon,
  onPress,
  style,
  accessibilityLabel,
}: ChipProps) {
  const colors = useColors();
  const styles = useStyles();
  const fg = on ? colors.onInverse : colors.text;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: on }}
      style={[styles.base, on && styles.on, style]}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text style={styles.label} color={fg} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
});

const useStyles = createStyles((t) => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radii.chip,
    backgroundColor: t.colors.surface,
  },
  on: { backgroundColor: t.colors.inverse },
  label: { fontFamily: fontFamily(600), fontSize: 14, lineHeight: 18 },
}));
