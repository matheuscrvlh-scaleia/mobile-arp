import { StyleSheet, View } from "react-native";
import { createStyles, Text } from "@/design";

/** Linha com texto no meio (.or). */
export function OrDivider({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="small" tone="textMuted">
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2, backgroundColor: t.colors.border },
}));
