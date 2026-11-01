import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { createStyles, Icon, type IconName, layout, Text, useColors } from "@/design";

type Props = {
  /** Foto ou ícone à esquerda (44 × 44). */
  leading: ReactNode;
  title: string;
  subtitle?: string;
  trailingIcon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Linha de lista com mídia à esquerda (.place do mapa / resultados da busca). */
export function ResultRow({
  leading,
  title,
  subtitle,
  trailingIcon = "chevron-right",
  selected = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const c = useColors();
  const styles = useStyles();
  const content = (
    <>
      {leading}
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onPress ? <Icon name={trailingIcon} size={20} color={c.textMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, selected && styles.on]}
    >
      {content}
    </Pressable>
  );
}

/** Quadrado colorido com ícone (.place .mono). */
export function MonoTile({
  icon,
  color,
  iconColor,
  size = 44,
}: {
  icon: IconName;
  color: string;
  /** Padrão `onMedia` (branco: o quadrado costuma ser uma cor viva). */
  iconColor?: string;
  size?: number;
}) {
  const c = useColors();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.mono,
        { width: size, height: size, borderRadius: size / 2.9, backgroundColor: color },
      ]}
    >
      <Icon name={icon} size={20} color={iconColor ?? c.onMedia} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: layout.gutter,
  },
  pressed: { backgroundColor: t.colors.surfaceSunken },
  on: { backgroundColor: t.colors.brand50 },
  text: { flex: 1, minWidth: 0 },
  mono: { alignItems: "center", justifyContent: "center" },
}));
