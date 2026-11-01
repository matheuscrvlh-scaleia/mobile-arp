import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { createStyles, Icon, type IconName, radii, Text, useColors } from "@/design";

/** Lista de regras (.rules): fundo card com linhas separadas. */
export function Rules({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.rules}>{children}</View>;
}

export type RuleProps = {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
  /** A última linha não tem borda. */
  last?: boolean;
  accessibilityHint?: string;
};

/** Linha (.rule): ícone em quadro elevado, rótulo pequeno e valor; com toque ganha chevron. */
export function Rule({ icon, label, value, onPress, last, accessibilityHint }: RuleProps) {
  const colors = useColors();
  const styles = useStyles();
  const body = (
    <>
      <View style={styles.ic}>
        <Icon name={icon} size={19} />
      </View>
      <View style={styles.texts}>
        <Text variant="small" tone="textMuted">
          {label}
        </Text>
        <Text variant="bodyStrong">{value}</Text>
      </View>
      {onPress ? <Icon name="chevron-right" color={colors.textMuted} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={[styles.rule, !last && styles.border]} accessible>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.rule, !last && styles.border, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  rules: {
    marginTop: 18,
    gap: 2,
    backgroundColor: t.colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  rule: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  pressed: { opacity: 0.6 },
  ic: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0 },
}));
