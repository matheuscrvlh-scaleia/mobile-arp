import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "@/core/web-shims";
import { boot } from "@/core/boot";
import {
  useNotificationResponses,
  usePushNotifications,
} from "@/core/notifications/use-push-notifications";
import { AppProviders } from "@/core/providers";
import { GEIST_FONTS, OverlayHost, useColors } from "@/design";
import { NavigationThemeProvider } from "@/navigation/NavigationTheme";
import { useSessionNotices } from "@/navigation/useSessionNotices";

void SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(GEIST_FONTS);
  const [booted, setBooted] = useState(false);
  const [cacheRestored, setCacheRestored] = useState(false);

  useEffect(() => {
    void boot().finally(() => setBooted(true));
  }, []);

  const ready = (fontsLoaded || fontError !== null) && booted;
  usePushNotifications(booted);
  useNotificationResponses(ready);
  useSessionNotices();

  useEffect(() => {
    if (ready && cacheRestored) void SplashScreen.hideAsync();
  }, [ready, cacheRestored]);

  return (
    <AppProviders onCacheRestored={() => setCacheRestored(true)}>
      {ready ? <RootStack /> : null}
      <OverlayHost />
    </AppProviders>
  );
}

/** A pilha raiz, dentro do AppProviders (ThemeProvider) para o fundo seguir o tema. */
function RootStack() {
  const colors = useColors();
  return (
    <NavigationThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="boas-vindas" options={{ animation: "fade", gestureEnabled: false }} />
        {/* Telas cheias como "card", não modal nativo: no iOS o modal ficaria por cima
            do OverlayHost e esconderia os painéis e avisos do leitor de QR. */}
        <Stack.Screen name="ler-qr" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen name="lojista/validar" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen
          name="selo-conquistado"
          options={{ animation: "fade", gestureEnabled: false }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
