import type { ReactNode } from "react";
import { View } from "react-native";
import {
  createStyles,
  Icon,
  type IconName,
  layout,
  PressableScale,
  Text,
  useColors,
} from "@/design";

/** Lista de opções do perfil (.menu). */
export function Menu({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.menu}>{children}</View>;
}

export type MenuItemProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Conteúdo à direita (pill, contagem, interruptor). */
  right?: ReactNode;
  /** Esconde a seta (ex.: Sair, interruptor). */
  noChevron?: boolean;
  danger?: boolean;
  last?: boolean;
  accessibilityHint?: string;
};

/** Item do menu (.menu-it): ícone num quadrado elevado, texto e o lado direito. */
export function MenuItem({
  icon,
  label,
  onPress,
  right,
  noChevron = false,
  danger = false,
  last = false,
  accessibilityHint,
}: MenuItemProps) {
  const colors = useColors();
  const styles = useStyles();
  const fg = danger ? colors.dangerText : colors.text;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[styles.item, !last && styles.divider]}
    >
      <View style={styles.icon}>
        <Icon name={icon} size={18} color={fg} />
      </View>
      <Text variant="body" weight={550} color={fg} style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.right}>
        {right}
        {noChevron ? null : <Icon name="chevron-right" size={18} color={colors.textMuted} />}
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  menu: {
    marginTop: 22,
    marginHorizontal: layout.gutter,
    backgroundColor: t.colors.surface,
    borderRadius: 26,
    paddingVertical: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
}));
