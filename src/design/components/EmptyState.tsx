import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { Button, type ButtonVariant } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type EmptyStateAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
};

export type EmptyStateProps = {
  icon?: IconName;
  title?: string;
  text?: ReactNode;
  action?: EmptyStateAction;
  /** padding do .empty: 40 30 (a agenda usa 20 30) */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Estado vazio (.empty): ícone num quadrado surface 72/24, título forte e texto cinza. */
export function EmptyState({ icon, title, text, action, compact, style }: EmptyStateProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.wrap, compact && styles.compact, style]}>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} color={colors.textMuted} />
        </View>
      ) : null}
      {title ? (
        <Text variant="h3" align="center" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {text ? (
        <Text variant="muted" align="center">
          {text}
        </Text>
      ) : null}
      {action ? (
        <View style={styles.action}>
          <Button
            label={action.label}
            onPress={action.onPress}
            variant={action.variant ?? "dark"}
            iconLeft={action.icon}
            loading={action.loading}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 30 },
  compact: { paddingVertical: 20 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { marginBottom: 4 },
  action: { marginTop: 20, alignSelf: "stretch" },
}));
