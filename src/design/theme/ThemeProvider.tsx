import * as SystemUI from "expo-system-ui";
import { createContext, type ReactNode, use, useEffect } from "react";
import { useColorScheme } from "react-native";
import { useStore } from "zustand";
import type { Palette } from "./palettes";
import { resolveScheme, themePreferenceStore } from "./preference";
import { type Theme, themes } from "./theme";

const ThemeContext = createContext<Theme | null>(null);

/**
 * Tema do app: preferência do visitante (Sistema/Claro/Escuro) + esquema do aparelho.
 * Montado uma vez em `AppProviders` (core/providers.tsx), por cima do navegador e do
 * OverlayHost: painéis e avisos abertos por função (`sheet.open`, `toast.show`) desenham
 * dentro dele e enxergam o tema.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useStore(themePreferenceStore, (s) => s.preference);
  const system = useColorScheme();
  const theme = themes[resolveScheme(preference, system)];

  // fundo da janela raiz (aparece atrás do teclado, nas transições e no "puxar" do iOS)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bg).catch(() => {});
  }, [theme]);

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

let warnedOutside = false;

/**
 * Tema atual: `{ scheme, dark, colors, tones, toneOf, gradients, shadows }`. O objeto é o mesmo
 * enquanto o esquema não muda (custo: uma leitura de contexto). Fora do ThemeProvider (testes)
 * cai no tema claro.
 */
export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (theme) return theme;
  if (__DEV__ && !warnedOutside && process.env.NODE_ENV !== "test") {
    warnedOutside = true;
    console.warn("[tema] useTheme fora do ThemeProvider: usando o tema claro.");
  }
  return themes.light;
}

/** Só as cores do tema atual (`useColors().text`). */
export function useColors(): Palette {
  return useTheme().colors;
}
