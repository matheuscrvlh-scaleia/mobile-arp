import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { layout } from "@/design";

/** Célula da grade de 2 colunas (.dgrid: gap 12, margem 20). O FlashList v2 não tem columnWrapperStyle. */
export function StoreGridCell({ index, children }: { index: number; children: ReactNode }) {
  return <View style={index % 2 === 0 ? styles.left : styles.right}>{children}</View>;
}

const HALF_GAP = 6;

const styles = StyleSheet.create({
  left: { flex: 1, paddingLeft: layout.gutter, paddingRight: HALF_GAP, paddingBottom: 12 },
  right: { flex: 1, paddingLeft: HALF_GAP, paddingRight: layout.gutter, paddingBottom: 12 },
});
