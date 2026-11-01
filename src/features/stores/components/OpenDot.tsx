import { View } from "react-native";
import { createStyles, Text, withAlpha } from "@/design";

/** .open-dot: bolinha verde com halo (aberto) ou cinza (fechado) + texto. */
export function OpenDot({ open, label }: { open: boolean; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={[styles.dot, open ? styles.on : styles.off]} />
      <Text variant="caption" tone="textMuted" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  on: { backgroundColor: t.colors.brand, boxShadow: `0 0 0 3px ${withAlpha(t.colors.brand, 0.2)}` },
  off: { backgroundColor: t.colors.textSubtle },
  label: { flexShrink: 1 },
}));
