import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { persistOptions, queryClient } from "@/core/query/query-client";
import { ThemeProvider } from "@/design/theme";

interface Props {
  children: ReactNode;
  /** Chamado quando o cache guardado terminou de carregar (mesmo vazio). */
  onCacheRestored?: () => void;
}

export function AppProviders({ children, onCacheRestored }: Props) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
          onSuccess={onCacheRestored}
          onError={onCacheRestored}
        >
          {/* tema por cima do navegador e do OverlayHost (painéis e avisos enxergam o tema) */}
          <ThemeProvider>{children}</ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
