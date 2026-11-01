import { memo } from "react";
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useColors } from "../theme/ThemeProvider";
import { fontFamily, hitSlop, layout } from "../tokens";
import { Icon } from "./Icon";
import { Text } from "./Text";

export type SectionHeaderProps = {
  title: string;
  /** Texto da ação à direita; só aparece com `onAction`. */
  actionLabel?: string;
  onAction?: () => void;
  /** Já vem com a margem do .sec-h (28 20 14); sobrescreva pelo style. */
  style?: StyleProp<ViewStyle>;
};

/** Título de seção (.sec-h) com "Ver todos ›" opcional. */
export const SectionHeader = memo(function SectionHeader({
  title,
  actionLabel = "Ver todos",
  onAction,
  style,
}: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={[styles.row, style]}>
      <Text variant="h2" accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText} tone="textMuted">
            {actionLabel}
          </Text>
          <Icon name="chevron-right" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: layout.sectionTop,
    marginBottom: layout.sectionBottom,
    marginHorizontal: layout.gutter,
  },
  title: { flexShrink: 1 },
  action: { flexDirection: "row", alignItems: "center", gap: 2 },
  actionText: { fontFamily: fontFamily(600), fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.6 },
});
