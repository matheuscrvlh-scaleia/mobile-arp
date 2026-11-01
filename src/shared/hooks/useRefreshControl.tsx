import { useState } from "react";
import { RefreshControl } from "react-native";
import { useColors } from "@/design";

/**
 * "Puxar para atualizar" padrão do app. O spinner reflete só o gesto do
 * visitante, nunca `isRefetching` (polling, foco e invalidações não piscam a tela).
 *   const refreshControl = useRefreshControl(home.refetch, count.refetch);
 *   <ScrollView refreshControl={refreshControl} />
 */
export function useRefreshControl(...refetchers: Array<() => Promise<unknown>>) {
  const [refreshing, setRefreshing] = useState(false);
  const colors = useColors();
  const onRefresh = () => {
    setRefreshing(true);
    void Promise.allSettled(refetchers.map((refetch) => refetch())).finally(() =>
      setRefreshing(false),
    );
  };
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.brandText}
      colors={[colors.brandText]}
      // Android: o disco do spinner é branco por padrão (destoaria no tema escuro)
      progressBackgroundColor={colors.surfaceRaised}
    />
  );
}
