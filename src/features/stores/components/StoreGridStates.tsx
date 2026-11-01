import { StyleSheet, View } from "react-native";
import { layout } from "@/design";
import { StoreCardSkeleton } from "./StoreCard";

/** Grade carregando (2 × rows). */
export function StoreGridSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }, (_, row) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas fixas
        <View key={row} style={styles.row}>
          <View style={styles.cell}>
            <StoreCardSkeleton />
          </View>
          <View style={styles.cell}>
            <StoreCardSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: layout.gutter, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  cell: { flex: 1 },
});
