import { View } from "react-native";
import { Skeleton } from "@/design";

/** Carregando um texto ou uma lista curta: título e algumas linhas. */
export function ContentSkeleton({
  rows = 5,
  rowHeight = 14,
}: {
  rows?: number;
  rowHeight?: number;
}) {
  return (
    <View style={{ gap: 12, paddingTop: 8 }}>
      <Skeleton height={28} width="60%" />
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas fixas do esqueleto
        <Skeleton key={i} height={rowHeight} width={i === rows - 1 ? "70%" : "100%"} />
      ))}
    </View>
  );
}
