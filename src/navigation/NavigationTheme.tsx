import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import type { ReactNode } from "react";
import { type Theme, themes, useTheme } from "@/design/theme";

type NavigationTheme = typeof DefaultTheme;

function toNavigation(theme: Theme): NavigationTheme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const c = theme.colors;
  return {
    ...base,
    dark: theme.dark,
    colors: {
      primary: c.brand,
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.border,
      notification: c.danger,
    },
  };
}

/* Um objeto por esquema, criado uma vez (o navegador compara por referência). */
const NAVIGATION_THEMES = { light: toNavigation(themes.light), dark: toNavigation(themes.dark) };

/**
 * Tema do React Navigation (fundo das cenas, transições, cabeçalhos nativos) seguindo o tema do
 * app. Fica dentro do ThemeProvider do design.
 */
export function NavigationThemeProvider({ children }: { children: ReactNode }) {
  const { scheme } = useTheme();
  return <ThemeProvider value={NAVIGATION_THEMES[scheme]}>{children}</ThemeProvider>;
}
