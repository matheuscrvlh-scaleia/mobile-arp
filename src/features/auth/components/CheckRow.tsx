import { Pressable, View } from "react-native";
import { createStyles, Icon, Text, useColors } from "@/design";

export type CheckRowProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  error?: string;
};

/** Caixa de seleção com texto (.check / .cb). */
export function CheckRow({ checked, onChange, label, error }: CheckRowProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        accessibilityHint={error}
        style={styles.row}
      >
        <View style={[styles.cb, checked && styles.cbOn, !!error && !checked && styles.cbError]}>
          {checked ? (
            <Icon name="check" size={15} color={colors.onInverse} strokeWidth={3} />
          ) : null}
        </View>
        <Text variant="small" tone="textSecondary" style={styles.text}>
          {label}
        </Text>
      </Pressable>
      {error ? (
        <Text
          variant="small"
          tone="dangerText"
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { marginTop: 14 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 24 },
  cb: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: t.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  cbOn: { backgroundColor: t.colors.inverse, borderColor: t.colors.inverse },
  cbError: { borderColor: t.colors.danger },
  text: { flex: 1, lineHeight: 19, paddingTop: 2 },
  error: { marginTop: 6, marginLeft: 36 },
}));
