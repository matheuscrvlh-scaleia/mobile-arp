import { View } from "react-native";
import { createStyles, Text } from "@/design";
import { formatTrevos, monthYear } from "../lib/club";

/** Linha do histórico: "Descarte de cápsulas · Novembro de 2026 · +10 Trevos". */
export function ConquestRow({ title, at, points }: { title: string; at: string; points: number }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption" tone="textMuted">
          {monthYear(at)}
        </Text>
      </View>
      <Text variant="smallStrong" tone="brandText" tabular>
        +{formatTrevos(points)}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
}));
