import { StyleSheet, View } from "react-native";
import { layout, radii, Skeleton } from "@/design";

/** Carregando o painel: hero, estoque e gráfico. */
export function OverviewSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Carregando os números da loja">
      <Skeleton height={248} radius={radii.cardLg} />
      <Skeleton height={150} radius={radii.card} />
      <Skeleton height={220} radius={radii.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18, paddingHorizontal: layout.gutter, gap: 12 },
});
